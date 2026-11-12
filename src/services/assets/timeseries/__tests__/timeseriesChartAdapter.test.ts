import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../mocks/assets';
import type { TimeseriesContextType } from '../../../../types/timeseries';
import { createTimeseriesChartAdapter, getChartableTimeseries } from '../timeseriesChartAdapter';

const options = { sourceName: 'CDF time series', isSimulated: false };
const pressure = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.PT-101',
  properties: [
    { identifier: 'name', label: 'Name', value: 'Discharge pressure' },
    { identifier: 'description', label: 'Description', value: 'Pump outlet' },
    { identifier: 'type', label: 'Type', value: 'numeric' },
    { identifier: 'engunits', label: 'Unit', value: 'bar' },
  ],
});
const temperature = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.TT-102',
  properties: [{ identifier: 'type', label: 'Type', value: 'numeric' }],
});
const status = makeInstanceDetails({
  space: 'ts',
  externalId: 'PI.XS-103',
  properties: [{ identifier: 'type', label: 'Type', value: 'string' }],
});
const HOUR_MS = 3_600_000;

describe(createTimeseriesChartAdapter.name, () => {
  let client: TimeseriesContextType;

  beforeEach(() => {
    client = {
      project: 'p',
      getTrends: vi.fn(() =>
        Promise.resolve([
          {
            space: 'ts',
            externalId: 'PI.PT-101',
            points: [{ timestamp: 1000, value: 4 }],
          },
        ]),
      ),
    };
  });

  function makeAdapter() {
    return createTimeseriesChartAdapter(client, [pressure, temperature, status], options);
  }

  it('offers only the numeric series, described from their properties', async () => {
    const page = await makeAdapter().searchSeries('', { limit: 10 });

    expect(page.total).toBe(2);
    expect(page.series[0]).toEqual({
      id: 'ts:PI.PT-101',
      name: 'Discharge pressure',
      tag: 'PI.PT-101',
      description: 'Pump outlet',
      unit: 'bar',
      dataType: 'Numeric',
      sourceName: 'CDF time series',
      isSimulated: false,
    });
    expect(page.series[1]).toMatchObject({
      name: 'PI.TT-102',
      unit: undefined,
    });
  });

  it('says when the readings are simulated', async () => {
    const adapter = createTimeseriesChartAdapter(client, [pressure], {
      sourceName: 'Mock',
      isSimulated: true,
    });

    const page = await adapter.searchSeries('', { limit: 10 });

    expect(page.series[0]).toMatchObject({ sourceName: 'Mock', isSimulated: true });
  });

  it('searches by name, external ID and description', async () => {
    const adapter = makeAdapter();

    expect((await adapter.searchSeries('pressure', { limit: 10 })).total).toBe(1);
    expect((await adapter.searchSeries('tt-102', { limit: 10 })).total).toBe(1);
    expect((await adapter.searchSeries('outlet', { limit: 10 })).total).toBe(1);
    expect((await adapter.searchSeries('nothing', { limit: 10 })).total).toBe(0);
  });

  it('returns only the first page of matches with the full total', async () => {
    const page = await makeAdapter().searchSeries('', { limit: 1 });

    expect(page.series).toHaveLength(1);
    expect(page.total).toBe(2);
  });

  it('reads the requested series at a step that fits the window', async () => {
    const adapter = makeAdapter();

    const data = await adapter.getSeriesData(['ts:PI.PT-101'], {
      start: 0,
      end: 24 * HOUR_MS,
    });

    expect(client.getTrends).toHaveBeenCalledWith(
      [{ space: 'ts', externalId: 'PI.PT-101' }],
      expect.objectContaining({ from: 0, to: 24 * HOUR_MS, granularity: '5m' }),
      { isStrict: true },
    );
    expect(data).toEqual([{ seriesId: 'ts:PI.PT-101', points: [{ timestamp: 1000, value: 4 }] }]);
  });

  it('passes a failed read on, so the chart shows the error and a retry', async () => {
    vi.mocked(client.getTrends).mockRejectedValue(new Error('no access'));

    await expect(
      makeAdapter().getSeriesData(['ts:PI.PT-101'], { start: 0, end: HOUR_MS }),
    ).rejects.toThrow('no access');
  });

  it('ignores series it does not know, such as non-numeric ones', async () => {
    const data = await makeAdapter().getSeriesData(['ts:PI.XS-103'], {
      start: 0,
      end: HOUR_MS,
    });

    expect(data).toEqual([]);
    expect(client.getTrends).not.toHaveBeenCalled();
  });

  it('looks up the details of one series', async () => {
    const adapter = makeAdapter();

    expect((await adapter.getSeriesDetails('ts:PI.PT-101'))?.name).toBe('Discharge pressure');
    expect(await adapter.getSeriesDetails('ts:missing')).toBeUndefined();
  });

  it('offers the limits of a series as thresholds', async () => {
    const limited = makeInstanceDetails({
      space: 'ts',
      externalId: 'PI.LIM',
      properties: [{ identifier: 'tripLimitMax', label: 'Trip', value: '10' }],
    });
    const adapter = createTimeseriesChartAdapter(client, [pressure, limited], options);

    expect(await adapter.getThresholds(['ts:PI.PT-101'])).toEqual([]);
    expect(await adapter.getThresholds(['ts:PI.LIM'])).toEqual([
      expect.objectContaining({ seriesId: 'ts:PI.LIM', value: 10 }),
    ]);
  });

  it('has no alerts, files or events to offer', async () => {
    const adapter = makeAdapter();
    const range = { start: 0, end: HOUR_MS };

    expect(await adapter.getAlerts(['ts:PI.PT-101'], range)).toEqual([]);
    expect(await adapter.getConnectedFiles('ts:PI.PT-101')).toEqual([]);
    expect(await adapter.getEvents(range)).toEqual([]);
  });
});

describe(getChartableTimeseries.name, () => {
  it('drops string and state series', () => {
    expect(getChartableTimeseries([pressure, status])).toEqual([pressure]);
  });
});
