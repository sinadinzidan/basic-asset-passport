import { describe, expect, it } from 'vitest';

import { makeMockTimeseriesContext } from '../mockTimeseriesContext';

const DAY_MS = 24 * 60 * 60 * 1000;
const window = { from: 0, to: 7 * DAY_MS, granularity: '6h' };
const first = {
  space: 'mock-timeseries-instances',
  externalId: 'PI.G307.PT-101',
};
const second = {
  space: 'mock-timeseries-instances',
  externalId: 'PI.G307.TT-102',
};

describe(makeMockTimeseriesContext.name, () => {
  it('returns a trend for each requested series', async () => {
    const client = makeMockTimeseriesContext(0);

    const trends = await client.getTrends([first, second], window);

    expect(trends.map(({ externalId }) => externalId)).toEqual([
      'PI.G307.PT-101',
      'PI.G307.TT-102',
    ]);
  });

  it('gives one oldest-first reading per step across the whole window', async () => {
    const client = makeMockTimeseriesContext(0);

    const [trend] = await client.getTrends([first], window);

    const timestamps = trend.points.map((point) => point.timestamp);

    expect(timestamps[0]).toBe(window.from);
    expect(timestamps[timestamps.length - 1]).toBe(window.to);
    expect(timestamps).toHaveLength(29);
    expect(timestamps).toEqual([...timestamps].sort((first, second) => first - second));
  });

  it('puts the readings on step boundaries', async () => {
    const client = makeMockTimeseriesContext(0);

    const [trend] = await client.getTrends([first], {
      from: 1000,
      to: 3 * 60 * 60 * 1000,
      granularity: '1h',
    });

    expect(trend.points.map((point) => point.timestamp)).toEqual([
      3_600_000, 7_200_000, 10_800_000,
    ]);
  });

  it('agrees with itself across windows', async () => {
    const client = makeMockTimeseriesContext(0);

    const [wide] = await client.getTrends([first], window);
    const [narrow] = await client.getTrends([first], {
      ...window,
      from: 2 * DAY_MS,
    });

    expect(wide.points).toEqual(expect.arrayContaining(narrow.points.slice(0, 3)));
  });

  it('never returns more readings than asked for', async () => {
    const client = makeMockTimeseriesContext(0);

    const [trend] = await client.getTrends([first], {
      from: 0,
      to: 30 * DAY_MS,
      granularity: '1m',
      limit: 50,
    });

    expect(trend.points).toHaveLength(50);
  });

  it('says its readings are simulated', () => {
    expect(makeMockTimeseriesContext(0).isSimulated).toBe(true);
  });

  it('gives the same readings every time', async () => {
    const client = makeMockTimeseriesContext(0);

    const [one] = await client.getTrends([first], window);
    const [two] = await client.getTrends([first], window);

    expect(two.points).toEqual(one.points);
  });

  it('gives different series different readings', async () => {
    const client = makeMockTimeseriesContext(0);

    const [one, two] = await client.getTrends([first, second], window);

    expect(two.points).not.toEqual(one.points);
  });

  it('draws a series it has no shape for', async () => {
    const client = makeMockTimeseriesContext(0);

    const [trend] = await client.getTrends([{ space: 'any', externalId: 'unknown' }], window);

    expect(trend.points.length).toBeGreaterThan(1);
  });
});
