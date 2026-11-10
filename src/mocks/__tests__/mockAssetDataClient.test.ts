import type { QueryRequest } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ASSET_QUERY_LIMIT } from '../../constants/assets';
import { DocumentOrigin } from '../../enums/documentOrigin';
import { getAssetEquipmentDetails } from '../../services/assets/assetDetailsService';
import { listAssets, searchAssets } from '../../services/assets/assetService';
import {
  deleteAssetDocument,
  listAssetDocuments,
  listAssetLinkedFiles,
  uploadAssetDocument,
} from '../../services/assets/documents/assetDocumentService';
import {
  createAssetNote,
  deleteAssetNote,
  listAssetNotes,
  updateAssetNote,
} from '../../services/assets/notes/assetNoteService';
import { listAssetTimeseries } from '../../services/assets/timeseries/assetTimeseriesService';
import { listAssetPassportViews } from '../../services/assets/viewHelpers';
import { MOCK_ASSETS, MOCK_ASSET_INSTANCE_SPACE } from '../mockAssetData';
import {
  makeMockAssetDataClient,
  makeMockDocumentFileClient,
  MOCK_LATENCY_MS,
  MOCK_PROJECT,
  MOCK_USER_IDENTIFIER,
  MOCK_USER_NAME,
} from '../mockAssetDataClient';

// The real services run against the mock, so these tests show the dummy data
// is accepted exactly as a CDF response would be.
describe(makeMockAssetDataClient.name, () => {
  const client = makeMockAssetDataClient(0);

  it('identifies itself with a mock project for query keys', () => {
    expect(client.project).toBe(MOCK_PROJECT);
  });

  it('serves a first page of assets with the next cursor', async () => {
    const page = await listAssets(client);

    expect(page.items).toHaveLength(ASSET_QUERY_LIMIT);
    expect(page.nextCursor).not.toBeNull();
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        externalId: 'FLOC-1001',
        name: 'Cooling Water Pump 1',
        plantName: 'North Plant',
        flocStatus: 'Operating',
      }),
    );
  });

  it('finds assets whose name, description or plant holds the search text', async () => {
    const page = await searchAssets(client, 'cooling water');

    expect(page.nextCursor).toBeNull();
    expect(page.items.length).toBeGreaterThan(0);
    expect(
      page.items.every((item) =>
        [item.name, item.description, item.plantName]
          .join(' ')
          .toLowerCase()
          .includes('cooling water'),
      ),
    ).toBe(true);
  });

  it('finds nothing for text no asset holds', async () => {
    await expect(searchAssets(client, 'no-such-thing-xyz')).resolves.toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it('pages through every asset exactly once and ends without a cursor', async () => {
    const externalIds: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await listAssets(client, cursor);
      externalIds.push(...page.items.map((item) => item.externalId));
      cursor = page.nextCursor ?? undefined;
    } while (cursor !== undefined);

    expect(externalIds).toHaveLength(MOCK_ASSETS.length);
    expect(new Set(externalIds).size).toBe(MOCK_ASSETS.length);
  });

  it('includes assets with missing values to exercise the empty labels', async () => {
    const page = await listAssets(client);

    expect(page.items.some((item) => item.description === null)).toBe(true);
  });

  it('serves the details of an asset with its linked equipment', async () => {
    const [asset] = MOCK_ASSETS;

    const details = await getAssetEquipmentDetails(client, {
      space: asset.space,
      externalId: asset.externalId,
    });

    expect(details.asset.externalId).toBe(asset.externalId);
    expect(details.asset.properties.map((p) => p.identifier)).toEqual(
      expect.arrayContaining(['name', 'plantName', 'flocStatus']),
    );
    expect(details.equipment.length).toBeGreaterThan(0);
  });

  it('leaves out system, relation and JSON properties like the app does', async () => {
    const [asset] = MOCK_ASSETS;

    const { asset: details } = await getAssetEquipmentDetails(client, {
      space: asset.space,
      externalId: asset.externalId,
    });
    const identifiers = details.properties.map((p) => p.identifier);

    expect(identifiers).not.toContain('sourceSystem');
    expect(identifiers).not.toContain('functionalLocationId');
    expect(identifiers).not.toContain('parent');
    expect(identifiers).not.toContain('metadata');
  });

  it('serves an asset with no equipment', async () => {
    const assetWithoutEquipment = MOCK_ASSETS[2];

    const details = await getAssetEquipmentDetails(client, {
      space: assetWithoutEquipment.space,
      externalId: assetWithoutEquipment.externalId,
    });

    expect(details.equipment).toEqual([]);
  });

  it('reports an unknown asset as not found, as CDF would return no node', async () => {
    await expect(
      getAssetEquipmentDetails(client, {
        space: 'mock-asset-instances',
        externalId: 'does-not-exist',
      }),
    ).rejects.toThrow('Asset does-not-exist was not found');
  });
});

describe('mock client requests', () => {
  const client = makeMockAssetDataClient(0);

  afterEach(() => {
    vi.useRealTimers();
  });

  it('answers a query for an unknown result set with nothing', async () => {
    const request: QueryRequest = {
      with: { unrelated: { nodes: {} } },
      select: {},
    };

    await expect(client.instances.query(request)).resolves.toEqual({
      items: {},
      nextCursor: {},
    });
  });

  it('returns every property when the request selects none', async () => {
    const request: QueryRequest = {
      with: { assets: { nodes: {}, limit: 1 } },
      select: {},
    };

    const response = await client.instances.query(request);

    const [node] = response.items.assets;
    const [properties] = Object.values(node.properties ?? {}).flatMap(
      Object.values,
    );
    expect(Object.keys(properties)).toEqual(
      expect.arrayContaining(['name', 'sourceSystem', 'metadata']),
    );
  });

  it('returns only the selected properties', async () => {
    const view = (await listAssetPassportViews(client)).find(
      ({ externalId }) => externalId === 'Asset',
    );
    if (!view) throw new Error('The mock Asset view is missing.');
    const request: QueryRequest = {
      with: { assets: { nodes: {}, limit: 1 } },
      select: {
        assets: {
          sources: [
            {
              source: {
                type: 'view',
                space: view.space,
                externalId: view.externalId,
                version: view.version,
              },
              properties: ['name'],
            },
          ],
        },
      },
    };

    const response = await client.instances.query(request);

    const [node] = response.items.assets;
    const [properties] = Object.values(node.properties ?? {}).flatMap(
      Object.values,
    );
    expect(Object.keys(properties)).toEqual(['name']);
  });

  it('uses the default page size when the request sets no limit', async () => {
    const request: QueryRequest = {
      with: { assets: { nodes: {} } },
      select: {},
    };

    const response = await client.instances.query(request);

    expect(response.items.assets).toHaveLength(10);
  });

  it.each(['not-a-number', '-5', '1.5', ''])(
    'starts from the first page for the invalid cursor %j',
    async (cursor) => {
      const request: QueryRequest = {
        with: { assets: { nodes: {}, limit: 2 } },
        select: {},
        cursors: { assets: cursor },
      };

      const response = await client.instances.query(request);

      expect(response.items.assets[0].externalId).toBe(
        MOCK_ASSETS[0].externalId,
      );
    },
  );

  it('finds no asset when the request has no identifying filter', async () => {
    const request: QueryRequest = {
      with: { asset: { nodes: { filter: { hasData: [] } }, limit: 1 } },
      select: {},
    };

    const response = await client.instances.query(request);

    expect(response.items.asset).toEqual([]);
    expect(response.items.equipment).toEqual([]);
  });

  it('finds no asset when a combined filter has no identifying part', async () => {
    const request: QueryRequest = {
      with: {
        asset: {
          nodes: { filter: { and: [{ hasData: [] }, { hasData: [] }] } },
          limit: 1,
        },
      },
      select: {},
    };

    const response = await client.instances.query(request);

    expect(response.items.asset).toEqual([]);
  });

  it('finds no asset when the space does not match', async () => {
    const [asset] = MOCK_ASSETS;
    const request: QueryRequest = {
      with: {
        asset: {
          nodes: {
            filter: {
              and: [
                {
                  equals: { property: ['node', 'space'], value: 'other-space' },
                },
                {
                  equals: {
                    property: ['node', 'externalId'],
                    value: asset.externalId,
                  },
                },
              ],
            },
          },
          limit: 1,
        },
      },
      select: {},
    };

    const response = await client.instances.query(request);

    expect(response.items.asset).toEqual([]);
  });

  it('simulates network latency so loading states can be seen', async () => {
    vi.useFakeTimers();
    const slowClient = makeMockAssetDataClient();
    const onSettled = vi.fn();

    void listAssets(slowClient).then(onSettled);
    // listAssets waits for the view lookup and then for the query.
    await vi.advanceTimersByTimeAsync(MOCK_LATENCY_MS);
    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(MOCK_LATENCY_MS);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});

describe(`${makeMockAssetDataClient.name} notes`, () => {
  const firstAsset = {
    space: MOCK_ASSET_INSTANCE_SPACE,
    externalId: 'FLOC-1001',
  };

  it('serves the Asset, Equipment, Timeseries, Note and Document views from the data model', async () => {
    const client = makeMockAssetDataClient(0);

    const views = await listAssetPassportViews(client);

    expect(views.map((view) => view.externalId)).toEqual([
      'Asset',
      'Equipment',
      'PI_Timeseries',
      'Note',
      'Document',
    ]);
  });

  it('lists the seeded notes of an asset, newest first', async () => {
    const client = makeMockAssetDataClient(0);

    const notes = await listAssetNotes(client, firstAsset);

    expect(notes.map((note) => note.title)).toEqual([
      'Vibration above normal',
      'Seal inspection',
    ]);
  });

  it('lists no notes for an asset that has none', async () => {
    const client = makeMockAssetDataClient(0);

    await expect(
      listAssetNotes(client, { ...firstAsset, externalId: 'FLOC-1010' }),
    ).resolves.toEqual([]);
  });

  it('keeps a created note and shows it first for that asset only', async () => {
    const client = makeMockAssetDataClient(0);

    await createAssetNote(client, firstAsset, {
      title: 'New finding',
      body: 'Checked on site',
    });

    const [newest] = await listAssetNotes(client, firstAsset);
    expect(newest).toEqual(
      expect.objectContaining({
        title: 'New finding',
        body: 'Checked on site',
        author: MOCK_USER_NAME,
      }),
    );
    const otherNotes = await listAssetNotes(client, {
      ...firstAsset,
      externalId: 'FLOC-1002',
    });
    expect(otherNotes.map((note) => note.title)).toEqual([
      'Valve actuator replaced',
    ]);
  });

  it('keeps an edited note where it was, with its author and date', async () => {
    const client = makeMockAssetDataClient(0);
    const [original] = await listAssetNotes(client, firstAsset);

    await updateAssetNote(client, original, {
      title: 'Edited title',
      body: 'Edited text',
    });

    const [edited] = await listAssetNotes(client, firstAsset);
    expect(edited).toEqual({
      ...original,
      title: 'Edited title',
      body: 'Edited text',
    });
  });

  it('shows an emptied note text as no text', async () => {
    const client = makeMockAssetDataClient(0);
    const [original] = await listAssetNotes(client, firstAsset);

    await updateAssetNote(client, original, { title: 'Title', body: '' });

    const [edited] = await listAssetNotes(client, firstAsset);
    expect(edited?.body).toBeNull();
  });

  it('removes a deleted note for that client only', async () => {
    const client = makeMockAssetDataClient(0);
    const other = makeMockAssetDataClient(0);
    const [doomed] = await listAssetNotes(client, firstAsset);

    await deleteAssetNote(client, doomed);

    expect(await listAssetNotes(client, firstAsset)).not.toContainEqual(doomed);
    expect(await listAssetNotes(other, firstAsset)).toContainEqual(doomed);
  });

  it('does not share created notes between clients', async () => {
    const first = makeMockAssetDataClient(0);
    const second = makeMockAssetDataClient(0);

    await createAssetNote(first, firstAsset, { title: 'Only here', body: '' });

    const notes = await listAssetNotes(second, firstAsset);
    expect(notes.map((note) => note.title)).not.toContain('Only here');
  });

  it('identifies the mock user for note authors', async () => {
    const client = makeMockAssetDataClient(0);

    await expect(client.profiles.me()).resolves.toEqual(
      expect.objectContaining({
        userIdentifier: MOCK_USER_IDENTIFIER,
        displayName: MOCK_USER_NAME,
      }),
    );
  });
});

describe(`${makeMockAssetDataClient.name} documents`, () => {
  const firstAsset = {
    space: MOCK_ASSET_INSTANCE_SPACE,
    externalId: 'FLOC-1001',
  };

  it('lists the seeded documents of an asset, newest first', async () => {
    const client = makeMockAssetDataClient(0);

    const documents = await listAssetDocuments(client, firstAsset);

    expect(documents.map((document) => document.name)).toEqual([
      'Maintenance schedule.xlsx',
      'Inspection photo.png',
      'Pump datasheet.pdf',
    ]);
    expect(documents.map((document) => document.isUploaded)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('lists no documents for an asset that has none', async () => {
    const client = makeMockAssetDataClient(0);

    await expect(
      listAssetDocuments(client, { ...firstAsset, externalId: 'FLOC-1010' }),
    ).resolves.toEqual([]);
  });

  it('does not mix notes and documents', async () => {
    const client = makeMockAssetDataClient(0);

    const notes = await listAssetNotes(client, firstAsset);

    expect(notes.map((note) => note.title)).not.toContain('Pump datasheet.pdf');
  });

  it('keeps an uploaded document and marks it uploaded once its content is sent', async () => {
    // Arrange
    const client = makeMockAssetDataClient(0);
    const files = makeMockDocumentFileClient(client, 0);
    const file = new File(['content'], 'new report.pdf', {
      type: 'application/pdf',
    });

    // Act
    await uploadAssetDocument(client, files, firstAsset, file);

    // Assert
    const [newest] = await listAssetDocuments(client, firstAsset);
    expect(newest).toEqual(
      expect.objectContaining({
        name: 'new report.pdf',
        mimeType: 'application/pdf',
        isUploaded: true,
      }),
    );
    expect(newest.uploadedTime).not.toBeNull();
  });

  it('removes a deleted document', async () => {
    const client = makeMockAssetDataClient(0);
    const [first] = await listAssetDocuments(client, firstAsset);

    await deleteAssetDocument(client, first);

    const remaining = await listAssetDocuments(client, firstAsset);
    expect(remaining.map((document) => document.externalId)).not.toContain(
      first.externalId,
    );
    expect(remaining).toHaveLength(2);
  });

  it('serves a temporary link for uploading', async () => {
    const files = makeMockDocumentFileClient(makeMockAssetDataClient(0), 0);
    const document = { space: 'data', externalId: 'doc-1' };

    await expect(files.requestUploadUrl(document)).resolves.toBe(
      'https://mock-upload.test/data/doc-1',
    );
  });
});

describe(`${makeMockAssetDataClient.name} existing files`, () => {
  const [firstAsset, secondAsset, thirdAsset] = MOCK_ASSETS.map((asset) => ({
    space: asset.space,
    externalId: asset.externalId,
  }));

  it('lists the files linked to an asset as read-only documents', async () => {
    const client = makeMockAssetDataClient(0);

    const files = await listAssetLinkedFiles(client, firstAsset);

    expect(files.map((file) => file.name).sort()).toEqual([
      'P&ID 1001.pdf',
      'Pump data sheet.pdf',
    ]);
    expect(files.every((file) => file.origin === DocumentOrigin.RMDM)).toBe(
      true,
    );
  });

  it('lists a file for every asset it is linked to', async () => {
    const client = makeMockAssetDataClient(0);

    const files = await listAssetLinkedFiles(client, secondAsset);

    expect(files.map((file) => file.name)).toEqual(['Pump data sheet.pdf']);
  });

  it('has no existing files for an asset without any', async () => {
    const client = makeMockAssetDataClient(0);

    expect(await listAssetLinkedFiles(client, thirdAsset)).toEqual([]);
  });

  it('keeps them apart from the documents uploaded in the app', async () => {
    const client = makeMockAssetDataClient(0);

    const documents = await listAssetDocuments(client, firstAsset);

    expect(documents.map((document) => document.name)).not.toContain(
      'P&ID 1001.pdf',
    );
  });
});

describe(`${makeMockAssetDataClient.name} timeseries`, () => {
  const [firstAsset, secondAsset, thirdAsset] = MOCK_ASSETS.map((asset) => ({
    space: asset.space,
    externalId: asset.externalId,
  }));

  it('lists the series linked to an asset, sorted by name', async () => {
    const client = makeMockAssetDataClient(0);

    const timeseries = await listAssetTimeseries(client, firstAsset);

    expect(timeseries.map((series) => series.properties[0]?.value)).toEqual([
      'Discharge pressure',
      'Motor temperature',
      'Running status',
    ]);
  });

  it('lists a series for every asset it is linked to', async () => {
    const client = makeMockAssetDataClient(0);

    const timeseries = await listAssetTimeseries(client, secondAsset);

    expect(timeseries.map((series) => series.properties[0]?.value)).toEqual([
      'Bearing vibration',
      'Motor temperature',
    ]);
  });

  it('has no series for an asset without any', async () => {
    const client = makeMockAssetDataClient(0);

    expect(await listAssetTimeseries(client, thirdAsset)).toEqual([]);
  });
});
