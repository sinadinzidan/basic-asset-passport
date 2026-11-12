import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../../../__mocks__/cogniteClient';
import { TREND_REQUEST_CHUNK_SIZE } from '../../../../constants/timeseries';
import { createTimeseriesContext } from '../timeseriesContext';

const window = { from: 1000, to: 5000, granularity: '6h' };
const first = { space: 'ts', externalId: 'PI.1' };
const second = { space: 'ts', externalId: 'PI.2' };

function response(items: unknown[]) {
  return { data: { items }, status: 200, headers: {} };
}

describe(createTimeseriesContext.name, () => {
  let sdk: CogniteClient;

  beforeEach(() => {
    sdk = makeOfflineSdkClient('my-project');
  });

  it('exposes the project of the SDK client', () => {
    expect(createTimeseriesContext(sdk).project).toBe('my-project');
  });

  it('asks for the averages of the series by instance ID in one request', async () => {
    const post = vi.spyOn(sdk, 'post').mockResolvedValue(response([]));

    await createTimeseriesContext(sdk).getTrends([first, second], window);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/api/v1/projects/my-project/timeseries/data/list', {
      data: {
        items: [{ instanceId: first }, { instanceId: second }],
        start: 1000,
        end: 5000,
        aggregates: ['average'],
        granularity: '6h',
      },
    });
  });

  it('sends whole-millisecond timestamps, which the datapoints API requires', async () => {
    const post = vi.spyOn(sdk, 'post').mockResolvedValue(response([]));

    await createTimeseriesContext(sdk).getTrends([first], {
      from: 1784819773261.0508,
      to: 1786397888356.964,
      granularity: '30m',
      limit: 2000,
    });

    const body = post.mock.calls[0]?.[1]?.data;
    expect(body).toMatchObject({
      start: 1784819773261,
      end: 1786397888357,
      limit: 2000,
    });
  });

  it('returns each series with its averages, oldest first', async () => {
    vi.spyOn(sdk, 'post').mockResolvedValue(
      response([
        {
          instanceId: first,
          datapoints: [
            { timestamp: 2000, average: 4 },
            { timestamp: 1000, average: 2 },
          ],
        },
      ]),
    );

    const trends = await createTimeseriesContext(sdk).getTrends([first], window);

    expect(trends).toEqual([
      {
        ...first,
        points: [
          { timestamp: 1000, value: 2 },
          { timestamp: 2000, value: 4 },
        ],
      },
    ]);
  });

  it('skips readings without an average and items it does not understand', async () => {
    vi.spyOn(sdk, 'post').mockResolvedValue(
      response([
        { instanceId: first, datapoints: [{ timestamp: 1000 }, { timestamp: 2000, average: 3 }] },
        { instanceId: 'nope', datapoints: [] },
        'junk',
      ]),
    );

    const trends = await createTimeseriesContext(sdk).getTrends([first], window);

    expect(trends).toEqual([{ ...first, points: [{ timestamp: 2000, value: 3 }] }]);
  });

  it('splits many series into requests of a limited size', async () => {
    const post = vi.spyOn(sdk, 'post').mockResolvedValue(response([]));
    const many = Array.from({ length: TREND_REQUEST_CHUNK_SIZE + 1 }, (_item, index) => ({
      space: 'ts',
      externalId: `PI.${index}`,
    }));

    await createTimeseriesContext(sdk).getTrends(many, window);

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('marks the series of a request that failed and keeps the rest', async () => {
    const many = Array.from({ length: TREND_REQUEST_CHUNK_SIZE + 1 }, (_item, index) => ({
      space: 'ts',
      externalId: `PI.${index}`,
    }));
    vi.spyOn(sdk, 'post')
      .mockRejectedValueOnce(new Error('bad request'))
      .mockResolvedValueOnce(
        response([
          {
            instanceId: many[TREND_REQUEST_CHUNK_SIZE],
            datapoints: [{ timestamp: 1000, average: 1 }],
          },
        ]),
      );

    const trends = await createTimeseriesContext(sdk).getTrends(many, window);

    expect(trends).toHaveLength(many.length);
    expect(trends[0]).toEqual({ ...many[0], points: [], hasFailed: true });
    expect(trends.filter((trend) => trend.hasFailed)).toHaveLength(TREND_REQUEST_CHUNK_SIZE);
    expect(trends[TREND_REQUEST_CHUNK_SIZE]).toEqual({
      ...many[TREND_REQUEST_CHUNK_SIZE],
      points: [{ timestamp: 1000, value: 1 }],
    });
  });

  it('rejects when a request failed, if asked to be strict', async () => {
    const many = Array.from({ length: TREND_REQUEST_CHUNK_SIZE + 1 }, (_item, index) => ({
      space: 'ts',
      externalId: `PI.${index}`,
    }));
    vi.spyOn(sdk, 'post')
      .mockRejectedValueOnce(new Error('bad request'))
      .mockResolvedValueOnce(response([]));

    await expect(
      createTimeseriesContext(sdk).getTrends(many, window, {
        isStrict: true,
      }),
    ).rejects.toThrow('bad request');
  });

  it('returns every series when strict and no request failed', async () => {
    vi.spyOn(sdk, 'post').mockResolvedValue(
      response([{ instanceId: first, datapoints: [{ timestamp: 1000, average: 2 }] }]),
    );

    const trends = await createTimeseriesContext(sdk).getTrends([first], window, {
      isStrict: true,
    });

    expect(trends).toEqual([{ ...first, points: [{ timestamp: 1000, value: 2 }] }]);
  });

  it('makes no request without series', async () => {
    const post = vi.spyOn(sdk, 'post');

    const trends = await createTimeseriesContext(sdk).getTrends([], window);

    expect(trends).toEqual([]);
    expect(post).not.toHaveBeenCalled();
  });
});
