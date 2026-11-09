import type { DataModel } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import {
  ASSET_PASSPORT_MODEL_EXTERNAL_ID,
  ASSET_PASSPORT_MODEL_SPACE,
  ASSET_PASSPORT_MODEL_VERSION,
} from '../../../constants/assets';
import { makeNodeInstance, makeViewDefinition } from '../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubModelViews,
} from '../../../mocks/cogniteClient';
import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
} from '../viewHelpers';

describe(listAssetPassportViews.name, () => {
  it('retrieves the Asset_Passport data model with its views inlined', async () => {
    // Arrange
    const client = makeOfflineSdkClient();
    const views = [makeViewDefinition('Asset')];
    const retrieve = stubModelViews(client, views);

    // Act
    const result = await listAssetPassportViews(client);

    // Assert
    expect(result).toEqual(views);
    expect(retrieve).toHaveBeenCalledWith(
      [
        {
          space: ASSET_PASSPORT_MODEL_SPACE,
          externalId: ASSET_PASSPORT_MODEL_EXTERNAL_ID,
          version: ASSET_PASSPORT_MODEL_VERSION,
        },
      ],
      { inlineViews: true },
    );
  });

  it('skips views that are only references', async () => {
    const client = makeOfflineSdkClient();
    const view = makeViewDefinition('Asset');
    vi.spyOn(client.dataModels, 'retrieve').mockResolvedValue({
      items: [
        {
          views: [
            { type: 'view', space: 's', externalId: 'Other', version: 'v1' },
            view,
          ],
        } as Partial<DataModel> as DataModel,
      ],
    });

    await expect(listAssetPassportViews(client)).resolves.toEqual([view]);
  });

  it('fails when the data model does not exist', async () => {
    const client = makeOfflineSdkClient();
    vi.spyOn(client.dataModels, 'retrieve').mockResolvedValue({ items: [] });

    await expect(listAssetPassportViews(client)).rejects.toThrow(
      `The ${ASSET_PASSPORT_MODEL_EXTERNAL_ID} data model was not found in ${ASSET_PASSPORT_MODEL_SPACE}.`,
    );
  });

  it('propagates a failed lookup', async () => {
    const client = makeOfflineSdkClient();
    vi.spyOn(client.dataModels, 'retrieve').mockRejectedValue(
      new Error('model unavailable'),
    );

    await expect(listAssetPassportViews(client)).rejects.toThrow(
      'model unavailable',
    );
  });
});

describe(toViewReference.name, () => {
  it('keeps only the identifying fields of a view', () => {
    const view = makeViewDefinition('Asset', { name: {} });

    expect(toViewReference(view)).toEqual({
      type: 'view',
      space: view.space,
      externalId: 'Asset',
      version: view.version,
    });
  });
});

describe(isNodeInstance.name, () => {
  it('accepts nodes and rejects edges', () => {
    const view = makeViewDefinition('Asset');
    const node = makeNodeInstance(view, { space: 's', externalId: 'n' }, {});

    expect(isNodeInstance(node)).toBe(true);
    expect(
      isNodeInstance({
        instanceType: 'edge',
        space: 's',
        externalId: 'e',
        version: 1,
        createdTime: 0,
        lastUpdatedTime: 0,
        type: { space: 's', externalId: 't' },
        startNode: { space: 's', externalId: 'a' },
        endNode: { space: 's', externalId: 'b' },
      }),
    ).toBe(false);
  });
});

describe(getNodeViewProperties.name, () => {
  it('returns the properties stored for the view', () => {
    const view = makeViewDefinition('Asset');
    const node = makeNodeInstance(
      view,
      { space: 's', externalId: 'n' },
      { name: 'Pump' },
    );

    expect(getNodeViewProperties(node, view)).toEqual({ name: 'Pump' });
  });

  it('returns undefined when the node has no data for the view', () => {
    const view = makeViewDefinition('Asset');
    const otherView = makeViewDefinition('Equipment');
    const node = makeNodeInstance(
      otherView,
      { space: 's', externalId: 'n' },
      { name: 'Pump' },
    );

    expect(getNodeViewProperties(node, view)).toBeUndefined();
  });
});
