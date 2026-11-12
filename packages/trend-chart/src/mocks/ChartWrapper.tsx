import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

import { ChartAdapterContext } from '../hooks/time-series-chart/useChartAdapter';
import type { ChartDataAdapter } from '../types/timeSeriesChart';

export const TEST_SCOPE_KEY = 'test-scope';

/**
 * Gives a hook or a component under test its data source and a query client of its own, so nothing is shared between tests
 * and a failed request is not asked again.
 */
export function createChartWrapper(
  adapter: ChartDataAdapter,
  scopeKey: string = TEST_SCOPE_KEY,
): ComponentType<{ children: ReactNode }> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const source = { adapter, scopeKey };
  return function ChartWrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ChartAdapterContext.Provider value={source}>{children}</ChartAdapterContext.Provider>
      </QueryClientProvider>
    );
  };
}

/** A promise a test settles when it chooses, to look at what is on screen while a request is still out. */
export function createDeferred<Value>(): {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
} {
  let settle: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolve) => {
    settle = resolve;
  });
  return { promise, resolve: (value) => settle(value) };
}
