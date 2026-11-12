import { createContext, useContext } from 'react';

import type { ChartDataAdapter } from '../../types/timeSeriesChart';

export interface ChartDataSource {
  adapter: ChartDataAdapter;
  scopeKey: string;
}

/** The chart takes its data source from context, so a page or a test can supply another. */
export const ChartAdapterContext = createContext<ChartDataSource | undefined>(undefined);

function useChartDataSource(): ChartDataSource {
  const source = useContext(ChartAdapterContext);
  if (!source)
    throw new Error(
      'A time-series chart needs a data adapter: render it inside a ChartAdapterContext provider.',
    );
  return source;
}

export function useChartAdapter(): ChartDataAdapter {
  return useChartDataSource().adapter;
}

export function useChartScopeKey(): string {
  return useChartDataSource().scopeKey;
}
