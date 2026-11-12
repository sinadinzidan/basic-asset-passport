import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createChartAdapter, createDefinition } from '../../../mocks/chartData';
import { createChartWrapper, createDeferred } from '../../../mocks/ChartWrapper';
import type { ChartDataAdapter, SeriesSearchPage } from '../../../types/timeSeriesChart';
import { useSeriesSearch } from '../useSeriesSearch';

const FIRST_PAGE: SeriesSearchPage = { series: [createDefinition({ id: 's1' })], total: 2 };
const BOTH: SeriesSearchPage = {
  series: [createDefinition({ id: 's1' }), createDefinition({ id: 's2' })],
  total: 2,
};

describe(useSeriesSearch.name, () => {
  it('is loading until the data source answers', () => {
    const { result } = renderSearch(vi.fn(() => createDeferred<SeriesSearchPage>().promise));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('asks the data source for the query, up to the limit', async () => {
    const searchSeries = vi.fn<ChartDataAdapter['searchSeries']>(async () => FIRST_PAGE);
    const { result } = renderSearch(searchSeries, { query: 'pump', limit: 50 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(searchSeries).toHaveBeenCalledWith('pump', { limit: 50 });
  });

  it('gives the page the data source answers with', async () => {
    const { result } = renderSearch(vi.fn(async () => FIRST_PAGE));

    await waitFor(() => expect(result.current.data).toEqual(FIRST_PAGE));
  });

  it('gives the error when the data source fails', async () => {
    const { result } = renderSearch(
      vi.fn(async () => Promise.reject(new Error('The source is down'))),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('The source is down');
  });

  it('asks again for another query', async () => {
    const searchSeries = vi.fn<ChartDataAdapter['searchSeries']>(async () => FIRST_PAGE);
    const { result, rerender } = renderSearch(searchSeries, { query: 'pump', limit: 50 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ query: 'valve', limit: 50 });

    await waitFor(() => expect(searchSeries).toHaveBeenLastCalledWith('valve', { limit: 50 }));
  });

  it('keeps the shorter page on screen while a longer one loads', async () => {
    const longer = createDeferred<SeriesSearchPage>();
    const searchSeries = vi.fn<ChartDataAdapter['searchSeries']>((_query, page) =>
      page.limit === 1 ? Promise.resolve(FIRST_PAGE) : longer.promise,
    );
    const { result, rerender } = renderSearch(searchSeries, { query: '', limit: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ query: '', limit: 2 });

    expect(result.current.data).toEqual(FIRST_PAGE);
    expect(result.current.isPlaceholderData).toBe(true);
    longer.resolve(BOTH);
    await waitFor(() => expect(result.current.data).toEqual(BOTH));
  });
});

function renderSearch(
  searchSeries: ChartDataAdapter['searchSeries'],
  initialProps: { query: string; limit: number } = { query: '', limit: 50 },
) {
  return renderHook(({ query, limit }) => useSeriesSearch(query, limit), {
    wrapper: createChartWrapper(createChartAdapter({ searchSeries })),
    initialProps,
  });
}
