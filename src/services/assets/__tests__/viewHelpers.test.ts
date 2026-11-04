import { describe, expect, it, vi } from 'vitest';

import {
  ASSET_VIEW_LOOKUP_LIMIT,
  ASSET_VIEW_SPACE,
} from '../../../constants/assets';
import { makeNodeInstance, makeViewDefinition } from '../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubViewList,
} from '../../../mocks/cogniteClient';
import {
  getNodeViewProperties,
  isNodeInstance,
  listAssetSpaceViews,
  toViewReference,
} from '../viewHelpers';

describe(listAssetSpaceViews.name, () => {
  it('lists the latest views of the asset space with inherited properties', async () => {
    // Arrange
    const client = makeOfflineSdkClient();
    const views = [makeViewDefinition('Asset')];
    const list = stubViewList(client, views);

    // Act
    const result = await listAssetSpaceViews(client);

    // Assert
    expect(result).toEqual(views);
    expect(list).toHaveBeenCalledWith({
      space: ASSET_VIEW_SPACE,
      allVersions: false,
      includeInheritedProperties: true,
      limit: ASSET_VIEW_LOOKUP_LIMIT,
    });
  });

  it('propagates a failed lookup', async () => {
    const client = makeOfflineSdkClient();
    const list = stubViewList(client, []);
    vi.mocked(list).mockImplementation(() => {
      throw new Error('views unavailable');
    });

    await expect(listAssetSpaceViews(client)).rejects.toThrow(
      'views unavailable',
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
