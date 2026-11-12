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
import { matchAssetRelation } from '../assetFilter';
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
type NodeProperties = Record<string, string | AssetIdentifier>;

const defaultDeps: CreateNoteDeps = { generateId: () => crypto.randomUUID() };

const NOTE_PROPERTIES = ['title', 'body', 'author'];

export interface AssetNoteService {
  listAssetNotes(assetIdentifier: AssetIdentifier, limit?: number): Promise<LimitedList<AssetNote>>;
  createAssetNote(assetIdentifier: AssetIdentifier, input: NewAssetNote): Promise<void>;
  updateAssetNote(note: NoteIdentifier, input: NewAssetNote): Promise<void>;
  deleteAssetNote(note: NoteIdentifier): Promise<void>;
}

class CdfAssetNoteService implements AssetNoteService {
  constructor(
    private readonly client: AssetContextType,
    private readonly deps: CreateNoteDeps,
  ) {}

  listAssetNotes = async (
    assetIdentifier: AssetIdentifier,
    limit: number = NOTE_QUERY_LIMIT,
  ): Promise<LimitedList<AssetNote>> => {
    const noteView = await findAssetPassportView(this.client, NOTE_VIEW_EXTERNAL_ID);
    const viewReference = toViewReference(noteView);
    const response = await this.client.instances.query({
      with: {
        notes: {
          nodes: {
            filter: {
              and: [{ hasData: [viewReference] }, matchAssetRelation(noteView, assetIdentifier)],
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
      (response.items.notes ?? [])
        .filter(isNodeInstance)
        .map((node) => toAssetNote(node, noteView)),
      limit,
    );
  };

  createAssetNote = async (
    assetIdentifier: AssetIdentifier,
    input: NewAssetNote,
  ): Promise<void> => {
    const note = normalizeNewAssetNote(input);
    const noteView = await findAssetPassportView(this.client, NOTE_VIEW_EXTERNAL_ID);
    const author = await readAuthor(this.client);

    await upsertNote(
      this.client,
      noteView,
      {
        space: NOTE_INSTANCE_SPACE,
        externalId: `${NOTE_EXTERNAL_ID_PREFIX}${this.deps.generateId()}`,
      },
      {
        ...note,
        ...(author ?? {}),
        [ASSET_RELATION_PROPERTY_IDENTIFIER]: {
          space: assetIdentifier.space,
          externalId: assetIdentifier.externalId,
        },
      },
    );
  };

  updateAssetNote = async (note: NoteIdentifier, input: NewAssetNote): Promise<void> => {
    const edited = normalizeNewAssetNote(input);
    const noteView = await findAssetPassportView(this.client, NOTE_VIEW_EXTERNAL_ID);

    await upsertNote(this.client, noteView, note, edited);
  };

  deleteAssetNote = async (note: NoteIdentifier): Promise<void> => {
    await this.client.instances.delete([
      { instanceType: INSTANCE_TYPE_NODE, space: note.space, externalId: note.externalId },
    ]);
  };
}

export function createAssetNoteService(
  client: AssetContextType,
  overrides?: Partial<CreateNoteDeps>,
): AssetNoteService {
  return new CdfAssetNoteService(client, { ...defaultDeps, ...overrides });
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

async function upsertNote(
  client: AssetContextType,
  noteView: ViewIdentity,
  note: NoteIdentifier,
  properties: NodeProperties,
): Promise<void> {
  await client.instances.upsert({
    items: [
      {
        instanceType: INSTANCE_TYPE_NODE,
        space: note.space,
        externalId: note.externalId,
        sources: [{ source: toViewReference(noteView), properties }],
      },
    ],
    autoCreateDirectRelations: false,
    autoCreateStartNodes: false,
    autoCreateEndNodes: false,
  });
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
