import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  NOTE_INSTANCE_SPACE,
  NOTE_QUERY_LIMIT,
} from '../../../constants/notes';
import {
  makeNodeInstance,
  makeQueryResponse,
  makeViewDefinition,
} from '../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubModelViews,
} from '../../../mocks/cogniteClient';
import { createAssetNote, listAssetNotes } from '../assetNoteService';

const noteView = makeViewDefinition(
  'Note',
  { title: {}, body: {}, author: {}, authorId: {}, asset: { type: 'direct' } },
  'v1',
  'sp-asset-passport',
);
const noteReference = {
  type: 'view',
  space: 'sp-asset-passport',
  externalId: 'Note',
  version: 'v1',
};
const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(listAssetNotes.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries the Note nodes linked to the asset', async () => {
    // Arrange
    stubModelViews(client, [noteView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ notes: [] }));

    // Act
    await listAssetNotes(client, assetIdentifier);

    // Assert
    expect(query).toHaveBeenCalledWith({
      with: {
        notes: {
          nodes: {
            filter: {
              and: [
                { hasData: [noteReference] },
                {
                  equals: {
                    property: ['sp-asset-passport', 'Note/v1', 'asset'],
                    value: assetIdentifier,
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
            { source: noteReference, properties: ['title', 'body', 'author'] },
          ],
        },
      },
    });
  });

  it('maps nodes to notes, newest first', async () => {
    // Arrange
    stubModelViews(client, [noteView]);
    const older = makeNote('note-old', 1_000, { title: 'Old', author: 'Sam' });
    const newer = makeNote('note-new', 2_000, { title: 'New', body: 'Text' });
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({ notes: [older, newer] }),
    );

    // Act
    const notes = await listAssetNotes(client, assetIdentifier);

    // Assert
    expect(notes).toEqual([
      {
        space: NOTE_INSTANCE_SPACE,
        externalId: 'note-new',
        title: 'New',
        body: 'Text',
        author: null,
        createdTime: 2_000,
      },
      {
        space: NOTE_INSTANCE_SPACE,
        externalId: 'note-old',
        title: 'Old',
        body: null,
        author: 'Sam',
        createdTime: 1_000,
      },
    ]);
  });

  it('returns an empty list when the asset has no notes', async () => {
    stubModelViews(client, [noteView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({}),
    );

    await expect(listAssetNotes(client, assetIdentifier)).resolves.toEqual([]);
  });

  it('fails when the Note view is not in the data model', async () => {
    stubModelViews(client, [makeViewDefinition('Asset')]);

    await expect(listAssetNotes(client, assetIdentifier)).rejects.toThrow(
      'The Note view was not found in the Asset_Passport data model.',
    );
  });

  it('propagates a failed query', async () => {
    stubModelViews(client, [noteView]);
    vi.spyOn(client.instances, 'query').mockRejectedValue(
      new Error('query failed'),
    );

    await expect(listAssetNotes(client, assetIdentifier)).rejects.toThrow(
      'query failed',
    );
  });
});

describe(createAssetNote.name, () => {
  let client: CogniteClient;
  const generateId = () => 'abc-123';

  beforeEach(() => {
    client = makeOfflineSdkClient();
    stubModelViews(client, [noteView]);
    vi.spyOn(client.profiles, 'me').mockResolvedValue({
      userIdentifier: 'user-1',
      displayName: 'Sam Operator',
      lastUpdatedTime: 0,
    });
  });

  it('upserts a note node linked to the asset without creating missing nodes', async () => {
    // Arrange
    const upsert = vi
      .spyOn(client.instances, 'upsert')
      .mockResolvedValue({ items: [] });

    // Act
    await createAssetNote(
      client,
      assetIdentifier,
      { title: ' Inspection ', body: ' Looks fine ' },
      { generateId },
    );

    // Assert
    expect(upsert).toHaveBeenCalledWith({
      items: [
        {
          instanceType: 'node',
          space: NOTE_INSTANCE_SPACE,
          externalId: 'note-abc-123',
          sources: [
            {
              source: noteReference,
              properties: {
                title: 'Inspection',
                body: 'Looks fine',
                author: 'Sam Operator',
                authorId: 'user-1',
                asset: assetIdentifier,
              },
            },
          ],
        },
      ],
      autoCreateDirectRelations: false,
      autoCreateStartNodes: false,
      autoCreateEndNodes: false,
    });
  });

  it('omits an empty body', async () => {
    const upsert = vi
      .spyOn(client.instances, 'upsert')
      .mockResolvedValue({ items: [] });

    await createAssetNote(
      client,
      assetIdentifier,
      { title: 'Title', body: '  ' },
      { generateId },
    );

    const [request] = upsert.mock.calls[0];
    const [item] = request.items;
    expect(item).toBeDefined();
    expect(JSON.stringify(item)).not.toContain('"body"');
  });

  it('saves the note without an author when the profile cannot be read', async () => {
    const upsert = vi
      .spyOn(client.instances, 'upsert')
      .mockResolvedValue({ items: [] });
    vi.spyOn(client.profiles, 'me').mockRejectedValue(new Error('no profile'));

    await createAssetNote(
      client,
      assetIdentifier,
      { title: 'Title', body: '' },
      { generateId },
    );

    expect(upsert).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(upsert.mock.calls[0][0]);
    expect(serialized).not.toContain('"author"');
    expect(serialized).not.toContain('"authorId"');
  });

  it('rejects an invalid note before calling CDF', async () => {
    const upsert = vi.spyOn(client.instances, 'upsert');

    await expect(
      createAssetNote(client, assetIdentifier, { title: ' ', body: '' }),
    ).rejects.toThrow('A note needs a title');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('fails when the Note view is not in the data model', async () => {
    stubModelViews(client, []);

    await expect(
      createAssetNote(client, assetIdentifier, { title: 'Title', body: '' }),
    ).rejects.toThrow(
      'The Note view was not found in the Asset_Passport data model.',
    );
  });

  it('propagates a failed write', async () => {
    vi.spyOn(client.instances, 'upsert').mockRejectedValue(
      new Error('Forbidden'),
    );

    await expect(
      createAssetNote(
        client,
        assetIdentifier,
        { title: 'Title', body: '' },
        { generateId },
      ),
    ).rejects.toThrow('Forbidden');
  });
});

function makeNote(
  externalId: string,
  createdTime: number,
  properties: Record<string, string>,
) {
  return {
    ...makeNodeInstance(
      noteView,
      { space: NOTE_INSTANCE_SPACE, externalId },
      properties,
    ),
    createdTime,
  };
}
