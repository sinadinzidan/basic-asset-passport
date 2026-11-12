import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeNodeInstance, makeQueryResponse, makeViewDefinition } from '../../../../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../../../../__mocks__/cogniteClient';
import { TIMESERIES_QUERY_LIMIT } from '../../../../constants/timeseries';
import { TestPropertyType } from '../../../../enums/testPropertyType';
import { createAssetTimeseriesService } from '../assetTimeseries';

const timeseriesView = makeViewDefinition(
  'PI_Timeseries',
  {
    name: { label: 'Name' },
    engunits: { label: 'Unit' },
    assets: { type: TestPropertyType.DIRECT },
  },
  'v1',
  'sp-dm-idi-rmdm',
);
const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const pressureSeries = makeSeries('PI.2', { name: 'Pressure', engunits: 'bar' });

describe('listAssetTimeseries', () => {
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
    await createAssetTimeseriesService(client).listAssetTimeseries(assetIdentifier);

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
          sort: [
            {
              property: ['sp-dm-idi-rmdm', 'PI_Timeseries/v1', 'name'],
              direction: 'ascending',
              nullsFirst: false,
            },
            {
              property: ['node', 'externalId'],
              direction: 'ascending',
              nullsFirst: false,
            },
          ],
          limit: TIMESERIES_QUERY_LIMIT + 1,
        },
      },
      select: {
        timeseries: {
          sources: [{ source: reference, properties: ['name', 'engunits'] }],
        },
      },
    });
  });

  it('sorts by external ID alone when the view has no name', async () => {
    const unnamedView = makeViewDefinition(
      'PI_Timeseries',
      { engunits: {}, assets: { type: TestPropertyType.DIRECT } },
      'v1',
      'sp-dm-idi-rmdm',
    );
    stubModelViews(client, [unnamedView]);
    const query = vi
      .spyOn(client.instances, 'query')
      .mockResolvedValue(makeQueryResponse({ timeseries: [] }));

    await createAssetTimeseriesService(client).listAssetTimeseries(assetIdentifier);

    expect(query.mock.calls[0]?.[0].with.timeseries).toMatchObject({
      sort: [
        {
          property: ['node', 'externalId'],
          direction: 'ascending',
          nullsFirst: false,
        },
      ],
    });
  });

  it('returns the series in the order the server sorted them, with their readable properties', async () => {
    stubModelViews(client, [timeseriesView]);
    vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        timeseries: [makeSeries('PI.1', { name: 'Flow' }), pressureSeries],
      }),
    );

    const timeseries =
      await createAssetTimeseriesService(client).listAssetTimeseries(assetIdentifier);

    expect(timeseries.hasMore).toBe(false);
    expect(timeseries.items.map((series) => series.externalId)).toEqual(['PI.1', 'PI.2']);
    expect(timeseries.items[1]?.properties).toEqual([
      { identifier: 'name', label: 'Name', value: 'Pressure' },
      { identifier: 'engunits', label: 'Unit', value: 'bar' },
    ]);
  });

  it('asks for one series more than the limit to learn whether more exist', async () => {
    stubModelViews(client, [timeseriesView]);
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue(
      makeQueryResponse({
        timeseries: [
          makeSeries('PI.1', { name: 'Flow' }),
          pressureSeries,
          makeSeries('PI.3', { name: 'Temperature' }),
        ],
      }),
    );

    const timeseries = await createAssetTimeseriesService(client).listAssetTimeseries(
      assetIdentifier,
      2,
    );

    expect(query.mock.calls[0]?.[0].with.timeseries?.limit).toBe(3);
    expect(timeseries.hasMore).toBe(true);
    expect(timeseries.items.map((series) => series.externalId)).toEqual(['PI.1', 'PI.2']);
  });

  it('fails when the data model has no PI_Timeseries view', async () => {
    stubModelViews(client, []);

    await expect(
      createAssetTimeseriesService(client).listAssetTimeseries(assetIdentifier),
    ).rejects.toThrow('The PI_Timeseries view was not found in the Asset_Passport data model.');
  });
});

function makeSeries(externalId: string, properties: Record<string, string>) {
  return makeNodeInstance(timeseriesView, { space: 'ts', externalId }, properties);
}
