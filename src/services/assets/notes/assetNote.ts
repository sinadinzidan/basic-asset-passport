import { ASSET_RELATION_PROPERTY_IDENTIFIER, INSTANCE_TYPE_NODE } from '../../../constants/cdfApi';
import {
  NOTE_EXTERNAL_ID_PREFIX,
  NOTE_INSTANCE_SPACE,
  NOTE_QUERY_LIMIT,
  NOTE_VIEW_EXTERNAL_ID,
} from '../../../constants/notes';
import { getRequestLimit, toLimitedList } from '../../../lib/limitedList';
import { normalizeNewAssetNote } from '../../../lib/noteInput';
import type { AssetIdentifier } from '../../../types/asset';
import type { AssetContextType } from '../../../types/assetContext';
import type { LimitedList } from '../../../types/list';
import type { AssetNote, NewAssetNote, NoteIdentifier } from '../../../types/note';
import { SORT_BY_EXTERNAL_ID, SORT_BY_NEWEST } from '../querySort';
import {
  findAssetPassportView,
  getNodeViewProperties,
  getStringProperty,
  isNodeInstance,
  toViewReference,
  type NodeInstance,
  type ViewIdentity,
} from '../viewHelpers';

type CreateNoteDeps = { generateId: () => string };

const defaultDeps: CreateNoteDeps = { generateId: () => crypto.randomUUID() };

const NOTE_PROPERTIES = ['title', 'body', 'author'];

export async function listAssetNotes(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  limit: number = NOTE_QUERY_LIMIT,
): Promise<LimitedList<AssetNote>> {
  const noteView = await findAssetPassportView(client, NOTE_VIEW_EXTERNAL_ID);
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
                    ASSET_RELATION_PROPERTY_IDENTIFIER,
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
        sort: [SORT_BY_NEWEST, SORT_BY_EXTERNAL_ID],
        limit: getRequestLimit(limit),
      },
    },
    select: {
      notes: {
        sources: [{ source: viewReference, properties: NOTE_PROPERTIES }],
      },
    },
  });

  return toLimitedList(
    (response.items.notes ?? []).filter(isNodeInstance).map((node) => toAssetNote(node, noteView)),
    limit,
  );
}

function toAssetNote(node: NodeInstance, view: ViewIdentity): AssetNote {
  const properties = getNodeViewProperties(node, view);

  return {
    space: node.space,
    externalId: node.externalId,
    title: getStringProperty(properties, 'title') ?? node.externalId,
    body: getStringProperty(properties, 'body'),
    author: getStringProperty(properties, 'author'),
    createdTime: node.createdTime,
  };
}

export async function createAssetNote(
  client: AssetContextType,
  assetIdentifier: AssetIdentifier,
  input: NewAssetNote,
  overrides?: Partial<CreateNoteDeps>,
): Promise<void> {
  const { generateId } = { ...defaultDeps, ...overrides };
  const note = normalizeNewAssetNote(input);
  const noteView = await findAssetPassportView(client, NOTE_VIEW_EXTERNAL_ID);
  const author = await readAuthor(client);

  await client.instances.upsert({
    items: [
      {
        instanceType: INSTANCE_TYPE_NODE,
        space: NOTE_INSTANCE_SPACE,
        externalId: `${NOTE_EXTERNAL_ID_PREFIX}${generateId()}`,
        sources: [
          {
            source: toViewReference(noteView),
            properties: {
              title: note.title,
              ...(note.body ? { body: note.body } : {}),
              ...(author ?? {}),
              [ASSET_RELATION_PROPERTY_IDENTIFIER]: {
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

export async function updateAssetNote(
  client: AssetContextType,
  note: NoteIdentifier,
  input: NewAssetNote,
): Promise<void> {
  const edited = normalizeNewAssetNote(input);
  const noteView = await findAssetPassportView(client, NOTE_VIEW_EXTERNAL_ID);

  await client.instances.upsert({
    items: [
      {
        instanceType: INSTANCE_TYPE_NODE,
        space: note.space,
        externalId: note.externalId,
        sources: [
          {
            source: toViewReference(noteView),
            properties: {
              title: edited.title,
              body: edited.body,
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

export async function deleteAssetNote(
  client: AssetContextType,
  note: NoteIdentifier,
): Promise<void> {
  await client.instances.delete([
    { instanceType: INSTANCE_TYPE_NODE, space: note.space, externalId: note.externalId },
  ]);
}

async function readAuthor(
  client: AssetContextType,
): Promise<{ author: string; authorId: string } | null> {
  try {
    const profile = await client.profiles.me();
    const name = profile.displayName?.trim() || profile.email?.trim();

    return name ? { author: name, authorId: profile.userIdentifier } : null;
  } catch {
    return null;
  }
}
