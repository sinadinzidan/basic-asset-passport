import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TIMESERIES_QUERY_LIMIT } from '../../../../constants/timeseries';
import {
  makeNodeInstance,
  makeQueryResponse,
  makeViewDefinition,
} from '../../../../mocks/cdf';
import {
  makeOfflineSdkClient,
  stubModelViews,
} from '../../../../mocks/cogniteClient';
import { getTimeseriesName, listAssetTimeseries } from '../assetTimeseriesService';

const timeseriesView = makeViewDefinition(
  'PI_Timeseries',
  {
    name: { label: 'Name' },
    engunits: { label: 'Unit' },
    assets: { type: 'direct' },
  },
  'v1',
  'sp-dm-idi-rmdm',
);
const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(listAssetTimeseries.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient();
  });

  it('queries the PI_Timeseries nodes whose assets include the asset', async () => {
    // Arrange
    stubModelViews(client, [timeseriesView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ timeseries: [] }));

    // Act
    await listAssetTimeseries(client, assetIdentifier);

    // Assert
    const reference = {
      type: 'view',
      space: 'sp-dm-idi-rmdm',
      externalId: 'PI_Timeseries',
      version: 'v1',
    };
    expect(query).toHaveBeenCalledWith({
      with: {
        timeseries: {
          nodes: {
            filter: {
              and: [
                { hasData: [reference] },
                {
                  containsAny: {
                    property: ['sp-dm-idi-rmdm', 'PI_Timeseries/v1', 'assets'],
                    values: [{ space: 'asset-space', externalId: 'FLOC-1' }],
                  },
                },
              ],
            },
          },
          limit: TIMESERIES_QUERY_LIMIT,
        },
      },
      select: {
        timeseries: {
          sources: [{ source: reference, properties: ['name', 'engunits'] }],
        },
      },
    });
  });

  it('returns the series sorted by name with their readable properties', async () => {
    stubModelViews(client, [timeseriesView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        timeseries: [
          makeNodeInstance(
            timeseriesView,
            { space: 'ts', externalId: 'PI.2' },
            { name: 'Pressure', engunits: 'bar' },
          ),
          makeNodeInstance(
            timeseriesView,
            { space: 'ts', externalId: 'PI.1' },
            { name: 'Flow' },
          ),
        ],
      }),
    );

    const timeseries = await listAssetTimeseries(client, assetIdentifier);

    expect(timeseries.map((series) => series.externalId)).toEqual([
      'PI.1',
      'PI.2',
    ]);
    expect(timeseries[1]?.properties).toEqual([
      { identifier: 'name', label: 'Name', value: 'Pressure' },
      { identifier: 'engunits', label: 'Unit', value: 'bar' },
    ]);
  });

  it('fails when the data model has no PI_Timeseries view', async () => {
    stubModelViews(client, []);

    await expect(listAssetTimeseries(client, assetIdentifier)).rejects.toThrow(
      'The PI_Timeseries view was not found in the Asset_Passport data model.',
    );
  });
});

describe(getTimeseriesName.name, () => {
  it('falls back to the external ID when the series has no name', () => {
    expect(
      getTimeseriesName({ space: 'ts', externalId: 'PI.9', properties: [] }),
    ).toBe('PI.9');
  });
});
