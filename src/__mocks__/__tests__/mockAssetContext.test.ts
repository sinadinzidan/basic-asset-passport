import type { PropertySortV3, QueryRequest } from '@cognite/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MODEL } from '../../config/model';
import { ASSET_QUERY_LIMIT } from '../../constants/assets';
import { DocumentOrigin } from '../../enums/documentOrigin';
import { isOperatingStatus } from '../../lib/assetStatus';
import { createAssetService } from '../../services/assets/asset';
import { createAssetDetailsService } from '../../services/assets/assetDetails';
import { createAssetDetailsTabCountService } from '../../services/assets/assetDetailsTabCounts';
import { createAssetEquipmentService } from '../../services/assets/assetEquipment';
import { createAssetDocumentService } from '../../services/assets/documents/assetDocument';
import { createAssetNoteService } from '../../services/assets/notes/assetNote';
import { createRegisterSummaryService } from '../../services/assets/registerSummary';
import { createAssetTimeseriesService } from '../../services/assets/timeseries/assetTimeseries';
import { listAssetPassportViews } from '../../services/assets/viewHelpers';
import type { AssetListItem } from '../../types/asset';
import type { AssetContextType } from '../../types/assetContext';
import {
  makeMockAssetContext,
  makeMockDocumentFileContext,
  MOCK_LATENCY_MS,
  MOCK_PROJECT,
  MOCK_USER_IDENTIFIER,
  MOCK_USER_NAME,
} from '../mockAssetContext';
import {
  MOCK_ASSETS,
  MOCK_ASSET_INSTANCE_SPACE,
  MOCK_EQUIPMENT_BY_ASSET_ID,
} from '../mockAssetData';

const NEW_DOCUMENT_NAME = 'new report.pdf';

// The real services run against the mock, so these tests show the dummy data
// is accepted exactly as a CDF response would be.
describe(makeMockAssetContext.name, () => {
  const client = makeMockAssetContext(0);

  it('identifies itself with a mock project for query keys', () => {
    expect(client.project).toBe(MOCK_PROJECT);
  });

  it('serves a first page of assets with the next cursor', async () => {
    const page = await createAssetService(client).listAssets();

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
    const page = await createAssetService(client).searchAssets('cooling water');

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
    await expect(createAssetService(client).searchAssets('no-such-thing-xyz')).resolves.toEqual({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('pages through every asset exactly once and ends without a cursor', async () => {
    const externalIds: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await createAssetService(client).listAssets(cursor);

      externalIds.push(...page.items.map((item) => item.externalId));
      cursor = page.nextCursor ?? undefined;
    } while (cursor !== undefined);

    expect(externalIds).toHaveLength(MOCK_ASSETS.length);
    expect(new Set(externalIds).size).toBe(MOCK_ASSETS.length);
  });

  it('includes assets with missing values to exercise the empty labels', async () => {
    const page = await createAssetService(client).listAssets();

    expect(page.items.some((item) => item.description === null)).toBe(true);
  });

  it('serves the details of an asset', async () => {
    const [asset] = MOCK_ASSETS;

    const details = await createAssetDetailsService(client).getAssetDetails({
      space: asset.space,
      externalId: asset.externalId,
    });

    expect(details.externalId).toBe(asset.externalId);
    expect(details.properties.map((property) => property.identifier)).toEqual(
      expect.arrayContaining(['name', 'plantName', 'flocStatus']),
    );
  });

  it('serves the equipment linked to an asset', async () => {
    const [asset] = MOCK_ASSETS;

    const equipment = await createAssetEquipmentService(client).listAssetEquipment({
      space: asset.space,
      externalId: asset.externalId,
    });

    expect(equipment.items.length).toBeGreaterThan(0);
  });

  it('leaves out system, relation and JSON properties like the app does', async () => {
    const [asset] = MOCK_ASSETS;

    const details = await createAssetDetailsService(client).getAssetDetails({
      space: asset.space,
      externalId: asset.externalId,
    });
    const identifiers = details.properties.map((property) => property.identifier);

    expect(identifiers).not.toContain('sourceSystem');
    expect(identifiers).not.toContain('functionalLocationId');
    expect(identifiers).not.toContain('parent');
    expect(identifiers).not.toContain('metadata');
  });

  it('serves an asset with no equipment', async () => {
    const assetWithoutEquipment = MOCK_ASSETS[2];

    const equipment = await createAssetEquipmentService(client).listAssetEquipment({
      space: assetWithoutEquipment.space,
      externalId: assetWithoutEquipment.externalId,
    });

    expect(equipment).toEqual({ items: [], hasMore: false });
  });

  it('reports an unknown asset as not found, as CDF would return no node', async () => {
    await expect(
      createAssetDetailsService(client).getAssetDetails({
        space: 'mock-asset-instances',
        externalId: 'does-not-exist',
      }),
    ).rejects.toThrow('Asset does-not-exist was not found');
  });
});

describe('mock client requests', () => {
  const client = makeMockAssetContext(0);

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
    const [properties] = Object.values(node.properties ?? {}).flatMap(Object.values);

    expect(Object.keys(properties)).toEqual(
      expect.arrayContaining(['name', 'sourceSystem', 'metadata']),
    );
  });

  it('returns only the selected properties', async () => {
    const view = (await listAssetPassportViews(client)).find(
      ({ externalId }) => externalId === MODEL.views.asset,
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
    const [properties] = Object.values(node.properties ?? {}).flatMap(Object.values);

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

      expect(response.items.assets[0].externalId).toBe(MOCK_ASSETS[0].externalId);
    },
  );

  it('finds no asset when the request has no identifying filter', async () => {
    const request: QueryRequest = {
      with: { asset: { nodes: { filter: { hasData: [] } }, limit: 1 } },
      select: {},
    };

    const response = await client.instances.query(request);

    expect(response.items.asset).toEqual([]);
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
    const slowClient = makeMockAssetContext();
    const onSettled = vi.fn();

    void createAssetService(slowClient).listAssets().then(onSettled);
    // listAssets waits for the view lookup and then for the query.
    await vi.advanceTimersByTimeAsync(MOCK_LATENCY_MS);
    expect(onSettled).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(MOCK_LATENCY_MS);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});

describe(`${makeMockAssetContext.name} notes`, () => {
  const firstAsset = {
    space: MOCK_ASSET_INSTANCE_SPACE,
    externalId: 'FLOC-1001',
  };

  it('serves the Asset, Equipment, Timeseries, Note and Document views from the data model', async () => {
    const client = makeMockAssetContext(0);

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
    const client = makeMockAssetContext(0);

    const { items: notes } = await createAssetNoteService(client).listAssetNotes(firstAsset);

    expect(notes.map((note) => note.title)).toEqual(['Vibration above normal', 'Seal inspection']);
  });

  it('lists no notes for an asset that has none', async () => {
    const client = makeMockAssetContext(0);

    await expect(
      createAssetNoteService(client).listAssetNotes({ ...firstAsset, externalId: 'FLOC-1010' }),
    ).resolves.toEqual({ items: [], hasMore: false });
  });

  it('counts what each list holds, as the lists do', async () => {
    const client = makeMockAssetContext(0);

    const counts = {
      notes: await createAssetDetailsTabCountService(client).countAssetNotes(firstAsset),
      timeseries: await createAssetDetailsTabCountService(client).countAssetTimeseries(firstAsset),
      documents: await createAssetDetailsTabCountService(client).countAssetDocuments(firstAsset),
      linkedFiles:
        await createAssetDetailsTabCountService(client).countAssetLinkedFiles(firstAsset),
      equipment: await createAssetDetailsTabCountService(client).countAssetEquipment(firstAsset),
    };

    expect(counts).toEqual({
      notes: (await createAssetNoteService(client).listAssetNotes(firstAsset)).items.length,
      timeseries: (await createAssetTimeseriesService(client).listAssetTimeseries(firstAsset)).items
        .length,
      documents: (await createAssetDocumentService(client).listAssetDocuments(firstAsset)).items
        .length,
      linkedFiles: (await createAssetDocumentService(client).listAssetLinkedFiles(firstAsset)).items
        .length,
      equipment: (await createAssetEquipmentService(client).listAssetEquipment(firstAsset)).items
        .length,
    });
    expect(counts.notes).toBeGreaterThan(0);
  });

  it('counts every asset of the register', async () => {
    const client = makeMockAssetContext(0);

    await expect(createRegisterSummaryService(client).countAllAssets()).resolves.toBe(
      MOCK_ASSETS.length,
    );
  });

  it('counts the assets that operate, as the table shows them', async () => {
    const client = makeMockAssetContext(0);
    const listed = await listEveryAsset(client);

    const operating = await createRegisterSummaryService(client).countOperatingAssets();

    expect(operating).toBe(listed.filter((asset) => isOperatingStatus(asset.flocStatus)).length);
    expect(operating).toBeGreaterThan(0);
    expect(operating).toBeLessThan(MOCK_ASSETS.length);
  });

  it('counts the equipment of every asset', async () => {
    const client = makeMockAssetContext(0);

    const total = await createRegisterSummaryService(client).countAllEquipment();

    expect(total).toBe(
      [...MOCK_EQUIPMENT_BY_ASSET_ID.values()].reduce(
        (sum, equipment) => sum + equipment.length,
        0,
      ),
    );
    expect(total).toBeGreaterThan(
      await createAssetDetailsTabCountService(client).countAssetEquipment(firstAsset),
    );
  });

  it('counts none for an asset that has none', async () => {
    const client = makeMockAssetContext(0);

    await expect(
      createAssetDetailsTabCountService(client).countAssetNotes({
        ...firstAsset,
        externalId: 'FLOC-1010',
      }),
    ).resolves.toBe(0);
  });

  it('counts a created note, and not a deleted one', async () => {
    const client = makeMockAssetContext(0);
    const before = await createAssetDetailsTabCountService(client).countAssetNotes(firstAsset);

    await createAssetNoteService(client).createAssetNote(firstAsset, {
      title: 'New',
      body: 'Text',
    });
    const afterCreate = await createAssetDetailsTabCountService(client).countAssetNotes(firstAsset);
    const [newest] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    await createAssetNoteService(client).deleteAssetNote(newest);

    expect(afterCreate).toBe(before + 1);
    await expect(
      createAssetDetailsTabCountService(client).countAssetNotes(firstAsset),
    ).resolves.toBe(before);
  });

  it('keeps a created note and shows it first for that asset only', async () => {
    const client = makeMockAssetContext(0);

    await createAssetNoteService(client).createAssetNote(firstAsset, {
      title: 'New finding',
      body: 'Checked on site',
    });

    const [newest] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    expect(newest).toEqual(
      expect.objectContaining({
        title: 'New finding',
        body: 'Checked on site',
        author: MOCK_USER_NAME,
      }),
    );
    const { items: otherNotes } = await createAssetNoteService(client).listAssetNotes({
      ...firstAsset,
      externalId: 'FLOC-1002',
    });

    expect(otherNotes.map((note) => note.title)).toEqual(['Valve actuator replaced']);
  });

  it('keeps an edited note where it was, with its author and date', async () => {
    const client = makeMockAssetContext(0);
    const [original] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    await createAssetNoteService(client).updateAssetNote(original, {
      title: 'Edited title',
      body: 'Edited text',
    });

    const [edited] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    expect(edited).toEqual({
      ...original,
      title: 'Edited title',
      body: 'Edited text',
    });
  });

  it('shows an emptied note text as no text', async () => {
    const client = makeMockAssetContext(0);
    const [original] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    await createAssetNoteService(client).updateAssetNote(original, { title: 'Title', body: '' });

    const [edited] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    expect(edited?.body).toBeNull();
  });

  it('removes a deleted note for that client only', async () => {
    const client = makeMockAssetContext(0);
    const other = makeMockAssetContext(0);
    const [doomed] = (await createAssetNoteService(client).listAssetNotes(firstAsset)).items;

    await createAssetNoteService(client).deleteAssetNote(doomed);

    expect(
      (await createAssetNoteService(client).listAssetNotes(firstAsset)).items,
    ).not.toContainEqual(doomed);
    expect((await createAssetNoteService(other).listAssetNotes(firstAsset)).items).toContainEqual(
      doomed,
    );
  });

  it('does not share an edited seeded note between clients', async () => {
    const first = makeMockAssetContext(0);
    const second = makeMockAssetContext(0);
    const [original] = (await createAssetNoteService(first).listAssetNotes(firstAsset)).items;

    await createAssetNoteService(first).updateAssetNote(original, {
      title: 'Edited here only',
      body: 'Edited text',
    });

    expect((await createAssetNoteService(second).listAssetNotes(firstAsset)).items).toContainEqual(
      original,
    );
  });

  it('does not share created notes between clients', async () => {
    const first = makeMockAssetContext(0);
    const second = makeMockAssetContext(0);

    await createAssetNoteService(first).createAssetNote(firstAsset, {
      title: 'Only here',
      body: '',
    });

    const { items: notes } = await createAssetNoteService(second).listAssetNotes(firstAsset);

    expect(notes.map((note) => note.title)).not.toContain('Only here');
  });

  it('identifies the mock user for note authors', async () => {
    const client = makeMockAssetContext(0);

    await expect(client.profiles.me()).resolves.toEqual(
      expect.objectContaining({
        userIdentifier: MOCK_USER_IDENTIFIER,
        displayName: MOCK_USER_NAME,
      }),
    );
  });
});

describe(`${makeMockAssetContext.name} documents`, () => {
  const firstAsset = {
    space: MOCK_ASSET_INSTANCE_SPACE,
    externalId: 'FLOC-1001',
  };

  it('lists the seeded documents of an asset, newest first', async () => {
    const client = makeMockAssetContext(0);

    const { items: documents, hasMore } =
      await createAssetDocumentService(client).listAssetDocuments(firstAsset);

    expect(hasMore).toBe(false);
    expect(documents.map((document) => document.name)).toEqual([
      'Maintenance schedule.xlsx',
      'Inspection photo.png',
      'Pump datasheet.pdf',
    ]);
    expect(documents.map((document) => document.isUploaded)).toEqual([false, true, true]);
  });

  it('lists no documents for an asset that has none', async () => {
    const client = makeMockAssetContext(0);

    await expect(
      createAssetDocumentService(client).listAssetDocuments({
        ...firstAsset,
        externalId: 'FLOC-1010',
      }),
    ).resolves.toEqual({ items: [], hasMore: false });
  });

  it('cuts the documents at the limit and says that more exist', async () => {
    const client = makeMockAssetContext(0);

    const documents = await createAssetDocumentService(client).listAssetDocuments(firstAsset, 2);

    expect(documents.items.map((document) => document.name)).toEqual([
      'Maintenance schedule.xlsx',
      'Inspection photo.png',
    ]);
    expect(documents.hasMore).toBe(true);
  });

  it('does not mix notes and documents', async () => {
    const client = makeMockAssetContext(0);

    const { items: notes } = await createAssetNoteService(client).listAssetNotes(firstAsset);

    expect(notes.map((note) => note.title)).not.toContain('Pump datasheet.pdf');
  });

  it('keeps an uploaded document and marks it uploaded once its content is sent', async () => {
    // Arrange
    const client = makeMockAssetContext(0);
    const files = makeMockDocumentFileContext(client, 0);
    const file = new File(['content'], NEW_DOCUMENT_NAME, {
      type: 'application/pdf',
    });

    // Act
    await createAssetDocumentService(client).uploadAssetDocument(files, firstAsset, file);

    // Assert
    const { items: documents } =
      await createAssetDocumentService(client).listAssetDocuments(firstAsset);
    const newest = documents.find((document) => document.name === NEW_DOCUMENT_NAME);

    expect(newest).toEqual(
      expect.objectContaining({
        mimeType: 'application/pdf',
        isUploaded: true,
      }),
    );
    expect(newest?.uploadedTime).not.toBeNull();
    // Newest of the uploaded ones; only the one still uploading stands above it.
    expect(documents.map((document) => document.name).slice(0, 2)).toEqual([
      'Maintenance schedule.xlsx',
      NEW_DOCUMENT_NAME,
    ]);
  });

  it('removes a deleted document', async () => {
    const client = makeMockAssetContext(0);
    const {
      items: [first],
    } = await createAssetDocumentService(client).listAssetDocuments(firstAsset);

    await createAssetDocumentService(client).deleteAssetDocument(first);

    const { items: remaining } =
      await createAssetDocumentService(client).listAssetDocuments(firstAsset);

    expect(remaining.map((document) => document.externalId)).not.toContain(first.externalId);
    expect(remaining).toHaveLength(2);
  });

  it('serves a temporary link for uploading', async () => {
    const files = makeMockDocumentFileContext(makeMockAssetContext(0), 0);
    const document = { space: 'data', externalId: 'doc-1' };

    await expect(files.requestUploadUrl(document)).resolves.toBe(
      'https://mock-upload.test/data/doc-1',
    );
  });
});

describe(`${makeMockAssetContext.name} existing files`, () => {
  const [firstAsset, secondAsset, thirdAsset] = MOCK_ASSETS.map((asset) => ({
    space: asset.space,
    externalId: asset.externalId,
  }));

  it('lists the files linked to an asset as read-only documents', async () => {
    const client = makeMockAssetContext(0);

    const { items: files } =
      await createAssetDocumentService(client).listAssetLinkedFiles(firstAsset);

    expect(files.map((file) => file.name).sort()).toEqual(['P&ID 1001.pdf', 'Pump data sheet.pdf']);
    expect(files.every((file) => file.origin === DocumentOrigin.RMDM)).toBe(true);
  });

  it('lists a file for every asset it is linked to', async () => {
    const client = makeMockAssetContext(0);

    const { items: files } =
      await createAssetDocumentService(client).listAssetLinkedFiles(secondAsset);

    expect(files.map((file) => file.name)).toEqual(['Pump data sheet.pdf']);
  });

  it('has no existing files for an asset without any', async () => {
    const client = makeMockAssetContext(0);

    expect(await createAssetDocumentService(client).listAssetLinkedFiles(thirdAsset)).toEqual({
      items: [],
      hasMore: false,
    });
  });

  it('keeps them apart from the documents uploaded in the app', async () => {
    const client = makeMockAssetContext(0);

    const { items: documents } =
      await createAssetDocumentService(client).listAssetDocuments(firstAsset);

    expect(documents.map((document) => document.name)).not.toContain('P&ID 1001.pdf');
  });
});

describe(`${makeMockAssetContext.name} timeseries`, () => {
  const [firstAsset, secondAsset, thirdAsset] = MOCK_ASSETS.map((asset) => ({
    space: asset.space,
    externalId: asset.externalId,
  }));

  it('lists the series linked to an asset, sorted by name', async () => {
    const client = makeMockAssetContext(0);

    const { items: timeseries } =
      await createAssetTimeseriesService(client).listAssetTimeseries(firstAsset);

    expect(timeseries.map((series) => series.properties[0]?.value)).toEqual([
      'Discharge pressure',
      'Motor temperature',
      'Running status',
    ]);
  });

  it('lists a series for every asset it is linked to', async () => {
    const client = makeMockAssetContext(0);

    const { items: timeseries } =
      await createAssetTimeseriesService(client).listAssetTimeseries(secondAsset);

    expect(timeseries.map((series) => series.properties[0]?.value)).toEqual([
      'Bearing vibration',
      'Motor temperature',
    ]);
  });

  it('has no series for an asset without any', async () => {
    const client = makeMockAssetContext(0);

    expect(await createAssetTimeseriesService(client).listAssetTimeseries(thirdAsset)).toEqual({
      items: [],
      hasMore: false,
    });
  });

  it('cuts the series at the limit, in name order, and says that more exist', async () => {
    const client = makeMockAssetContext(0);

    const timeseries = await createAssetTimeseriesService(client).listAssetTimeseries(
      firstAsset,
      2,
    );

    expect(timeseries.items.map((series) => series.properties[0]?.value)).toEqual([
      'Discharge pressure',
      'Motor temperature',
    ]);
    expect(timeseries.hasMore).toBe(true);
  });
});

describe(`${makeMockAssetContext.name} sorting and paging`, () => {
  const firstAsset = {
    space: MOCK_ASSET_INSTANCE_SPACE,
    externalId: 'FLOC-1001',
  };
  const secondAsset = { ...firstAsset, externalId: 'FLOC-1002' };

  it('hands out a cursor for an unsorted result set that has more, and reads on from it', async () => {
    // Arrange
    const client = makeMockAssetContext(0);
    const { items: allNotes } = await createAssetNoteService(client).listAssetNotes(firstAsset);

    // Act
    const firstPage = await client.instances.query(makeNotesRequest(firstAsset, { limit: 1 }));
    const secondPage = await client.instances.query({
      ...makeNotesRequest(firstAsset, { limit: 1 }),
      cursors: { notes: firstPage.nextCursor?.notes ?? '' },
    });

    // Assert
    expect(allNotes.length).toBeGreaterThan(1);
    expect(firstPage.items.notes).toHaveLength(1);
    expect(firstPage.nextCursor?.notes).toBeDefined();
    expect(secondPage.items.notes).toHaveLength(1);
    expect(secondPage.items.notes?.[0]?.externalId).not.toBe(
      firstPage.items.notes?.[0]?.externalId,
    );
  });

  it('hands out no cursor once the result set is read to its end', async () => {
    const client = makeMockAssetContext(0);

    const page = await client.instances.query(makeNotesRequest(firstAsset, { limit: 1000 }));

    expect(page.nextCursor).toEqual({});
  });

  it('hands out no cursor for a sorted result set, as the API does not', async () => {
    const client = makeMockAssetContext(0);

    const page = await client.instances.query(
      makeNotesRequest(firstAsset, {
        limit: 1,
        sort: [{ property: ['node', 'externalId'], direction: 'descending' }],
      }),
    );

    expect(page.items.notes).toHaveLength(1);
    expect(page.nextCursor).toEqual({});
  });

  it('sorts a result set by a node property in the direction asked for', async () => {
    const client = makeMockAssetContext(0);

    const ascending = await client.instances.query(
      makeNotesRequest(firstAsset, {
        limit: 1000,
        sort: [{ property: ['node', 'externalId'], direction: 'ascending' }],
      }),
    );
    const descending = await client.instances.query(
      makeNotesRequest(firstAsset, {
        limit: 1000,
        sort: [{ property: ['node', 'externalId'], direction: 'descending' }],
      }),
    );

    const ascendingIds = (ascending.items.notes ?? []).map((note) => note.externalId);

    expect(ascendingIds).toEqual([...ascendingIds].sort());
    expect((descending.items.notes ?? []).map((note) => note.externalId)).toEqual(
      [...ascendingIds].reverse(),
    );
  });

  it('serves the equipment of an asset sorted by name', async () => {
    const client = makeMockAssetContext(0);

    const equipment = await createAssetEquipmentService(client).listAssetEquipment(secondAsset);

    const names = equipment.items.map((item) => item.properties[0]?.value);

    expect(names).toHaveLength(2);
    expect(names).toEqual([...names].sort());
    expect(equipment.hasMore).toBe(false);
  });

  it('sorts the equipment as asked and cuts it at the limit', async () => {
    const client = makeMockAssetContext(0);

    const response = await client.instances.query({
      with: {
        equipment: {
          nodes: {
            filter: {
              equals: {
                property: ['mock-space', 'Equipment/1', 'asset'],
                value: {
                  space: secondAsset.space,
                  externalId: secondAsset.externalId,
                },
              },
            },
          },
          sort: [{ property: ['node', 'externalId'], direction: 'descending' }],
          limit: 1,
        },
      },
      select: { equipment: {} },
    });

    expect((response.items.equipment ?? []).map((node) => node.externalId)).toEqual(['EQ-P-202']);
  });
});

async function listEveryAsset(client: AssetContextType) {
  const assets: AssetListItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await createAssetService(client).listAssets(cursor);

    assets.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return assets;
}

function makeNotesRequest(
  assetIdentifier: { space: string; externalId: string },
  expression: { limit: number; sort?: PropertySortV3[] },
): QueryRequest {
  return {
    with: {
      notes: {
        nodes: {
          filter: {
            equals: {
              property: ['mock-view-space', 'Note/v1', 'asset'],
              value: assetIdentifier,
            },
          },
        },
        ...expression,
      },
    },
    select: { notes: {} },
  };
}
