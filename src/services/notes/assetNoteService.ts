import type { ViewDefinition } from '@cognite/sdk';

import { ASSET_PASSPORT_MODEL_EXTERNAL_ID } from '../../constants/assets';
import {
  NOTE_EXTERNAL_ID_PREFIX,
  NOTE_INSTANCE_SPACE,
  NOTE_QUERY_LIMIT,
  NOTE_VIEW_EXTERNAL_ID,
} from '../../constants/notes';
import { normalizeNewAssetNote } from '../../lib/noteInput';
import type { AssetIdentifier } from '../../types/asset';
import type { AssetDataClient } from '../../types/assetDataClient';
import type { AssetNote, NewAssetNote } from '../../types/note';
import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
} from '../assets/viewHelpers';

type CreateNoteDeps = { generateId: () => string };

const defaultDeps: CreateNoteDeps = { generateId: () => crypto.randomUUID() };

/** Notes written against an asset, newest first. */
export async function listAssetNotes(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
): Promise<AssetNote[]> {
  const noteView = await getNoteView(client);
  const viewReference = toViewReference(noteView);
  const response = await client.instances.query({
    with: {
      notes: {
        nodes: {
          filter: {
            and: [
              { hasData: [viewReference] },
              {
                equals: {
                  property: [
                    noteView.space,
                    `${noteView.externalId}/${noteView.version}`,
                    'asset',
                  ],
                  value: {
                    space: assetIdentifier.space,
                    externalId: assetIdentifier.externalId,
                  },
                },
              },
            ],
          },
        },
        limit: NOTE_QUERY_LIMIT,
      },
    },
    select: {
      notes: {
        sources: [
          { source: viewReference, properties: ['title', 'body', 'author'] },
        ],
      },
    },
  });

  return (response.items.notes ?? [])
    .filter(isNodeInstance)
    .map((node): AssetNote => {
      const properties = getNodeViewProperties(node, noteView);

      return {
        space: node.space,
        externalId: node.externalId,
        title: getStringProperty(properties, 'title') ?? node.externalId,
        body: getStringProperty(properties, 'body'),
        author: getStringProperty(properties, 'author'),
        createdTime: node.createdTime,
      };
    })
    .sort((first, second) => second.createdTime - first.createdTime);
}

/**
 * Writes one note node linked to the asset. Missing nodes are never
 * auto-created, so a wrong asset reference fails instead of creating an
 * empty asset.
 */
export async function createAssetNote(
  client: AssetDataClient,
  assetIdentifier: AssetIdentifier,
  input: NewAssetNote,
  overrides?: Partial<CreateNoteDeps>,
): Promise<void> {
  const { generateId } = { ...defaultDeps, ...overrides };
  const note = normalizeNewAssetNote(input);
  const noteView = await getNoteView(client);
  const author = await readAuthor(client);

  await client.instances.upsert({
    items: [
      {
        instanceType: 'node',
        space: NOTE_INSTANCE_SPACE,
        externalId: `${NOTE_EXTERNAL_ID_PREFIX}${generateId()}`,
        sources: [
          {
            source: toViewReference(noteView),
            properties: {
              title: note.title,
              ...(note.body ? { body: note.body } : {}),
              ...(author ?? {}),
              asset: {
                space: assetIdentifier.space,
                externalId: assetIdentifier.externalId,
              },
            },
          },
        ],
      },
    ],
    autoCreateDirectRelations: false,
    autoCreateStartNodes: false,
    autoCreateEndNodes: false,
  });
}

async function getNoteView(client: AssetDataClient): Promise<ViewDefinition> {
  const views = await listAssetPassportViews(client);
  const noteView = views.find(
    (view) => view.externalId === NOTE_VIEW_EXTERNAL_ID,
  );

  if (!noteView) {
    throw new Error(
      `The ${NOTE_VIEW_EXTERNAL_ID} view was not found in the ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model.`,
    );
  }

  return noteView;
}

/** The signed-in user, or null: a note without an author is still saved. */
async function readAuthor(
  client: AssetDataClient,
): Promise<{ author: string; authorId: string } | null> {
  try {
    const profile = await client.profiles.me();
    const name = profile.displayName?.trim() || profile.email?.trim();

    return name ? { author: name, authorId: profile.userIdentifier } : null;
  } catch {
    return null;
  }
}

function getStringProperty(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): string | null {
  const value = properties?.[propertyName];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
