import type { DataModel } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { makeNodeInstance, makeViewDefinition } from '../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../__mocks__/cogniteClient';
import { MODEL } from '../../../config/model';
import {
  findAssetPassportView,
  getNodeViewProperties,
  isNodeInstance,
  listAssetPassportViews,
  toViewReference,
  toViewPropertyPath,
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
          space: MODEL.space,
          externalId: MODEL.externalId,
          version: MODEL.version,
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
          views: [{ type: 'view', space: 's', externalId: 'Other', version: 'v1' }, view],
        } as Partial<DataModel> as DataModel,
      ],
    });

    await expect(listAssetPassportViews(client)).resolves.toEqual([view]);
  });

  it('fails when the data model does not exist', async () => {
    const client = makeOfflineSdkClient();

    vi.spyOn(client.dataModels, 'retrieve').mockResolvedValue({ items: [] });

    await expect(listAssetPassportViews(client)).rejects.toThrow(
      `The ${MODEL.externalId} data model was not found in ${MODEL.space}.`,
    );
  });

  it('propagates a failed lookup', async () => {
    const client = makeOfflineSdkClient();

    vi.spyOn(client.dataModels, 'retrieve').mockRejectedValue(new Error('model unavailable'));

    await expect(listAssetPassportViews(client)).rejects.toThrow('model unavailable');
  });

  it('asks for the data model once per client', async () => {
    const client = makeOfflineSdkClient();
    const retrieve = stubModelViews(client, [makeViewDefinition('Asset')]);

    await Promise.all([listAssetPassportViews(client), listAssetPassportViews(client)]);
    await listAssetPassportViews(client);

    expect(retrieve).toHaveBeenCalledTimes(1);
  });

  it('asks again for another client', async () => {
    const firstClient = makeOfflineSdkClient();
    const secondClient = makeOfflineSdkClient();
    const noteView = makeViewDefinition('Note');

    stubModelViews(firstClient, [makeViewDefinition('Asset')]);
    stubModelViews(secondClient, [noteView]);

    await listAssetPassportViews(firstClient);

    await expect(listAssetPassportViews(secondClient)).resolves.toEqual([noteView]);
  });

  it('asks again after a failed lookup', async () => {
    const client = makeOfflineSdkClient();
    const views = [makeViewDefinition('Asset')];
    const retrieve = vi
      .spyOn(client.dataModels, 'retrieve')
      .mockRejectedValueOnce(new Error('model unavailable'));

    await expect(listAssetPassportViews(client)).rejects.toThrow('model unavailable');
    stubModelViews(client, views);

    await expect(listAssetPassportViews(client)).resolves.toEqual(views);
    expect(retrieve).toHaveBeenCalledTimes(2);
  });
});

describe(findAssetPassportView.name, () => {
  it('finds a view of the data model by its external id', async () => {
    const client = makeOfflineSdkClient();
    const noteView = makeViewDefinition('Note');

    stubModelViews(client, [makeViewDefinition('Asset'), noteView]);

    await expect(findAssetPassportView(client, 'Note')).resolves.toEqual(noteView);
  });

  it('fails when the data model has no such view', async () => {
    const client = makeOfflineSdkClient();

    stubModelViews(client, [makeViewDefinition('Asset')]);

    await expect(findAssetPassportView(client, 'Note')).rejects.toThrow(
      `The Note view was not found in the ${MODEL.externalId} data model.`,
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

describe(toViewPropertyPath.name, () => {
  it('addresses a property of the view by space, view and version', () => {
    const view = { space: 'sp-model', externalId: 'Note', version: 'v1' };

    expect(toViewPropertyPath(view, 'asset')).toEqual(['sp-model', 'Note/v1', 'asset']);
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
    const node = makeNodeInstance(view, { space: 's', externalId: 'n' }, { name: 'Pump' });

    expect(getNodeViewProperties(node, view)).toEqual({ name: 'Pump' });
  });

  it('returns undefined when the node has no data for the view', () => {
    const view = makeViewDefinition('Asset');
    const otherView = makeViewDefinition('Equipment');
    const node = makeNodeInstance(otherView, { space: 's', externalId: 'n' }, { name: 'Pump' });

    expect(getNodeViewProperties(node, view)).toBeUndefined();
  });
});
