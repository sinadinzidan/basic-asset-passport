import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChartAdapter } from '../../../mocks/chartData';
import { createChartWrapper } from '../../../mocks/ChartWrapper';
import { useChartAdapter, useChartScopeKey } from '../useChartAdapter';

const MISSING_PROVIDER =
  'A time-series chart needs a data adapter: render it inside a ChartAdapterContext provider.';

afterEach(() => {
  vi.restoreAllMocks();
});

describe(useChartAdapter.name, () => {
  it('gives the adapter of the provider it is rendered in', () => {
    const adapter = createChartAdapter();

    const { result } = renderHook(() => useChartAdapter(), {
      wrapper: createChartWrapper(adapter),
    });

    expect(result.current).toBe(adapter);
  });

  it('says what is missing when it is rendered outside a provider', () => {
    silenceReactErrorLog();

    expect(() => renderHook(() => useChartAdapter())).toThrow(MISSING_PROVIDER);
  });
});

describe(useChartScopeKey.name, () => {
  it('gives the scope key of the provider it is rendered in', () => {
    const { result } = renderHook(() => useChartScopeKey(), {
      wrapper: createChartWrapper(createChartAdapter(), 'project-a'),
    });

    expect(result.current).toBe('project-a');
  });

  it('says what is missing when it is rendered outside a provider', () => {
    silenceReactErrorLog();

    expect(() => renderHook(() => useChartScopeKey())).toThrow(MISSING_PROVIDER);
  });
});

/** React logs an error thrown while rendering; the test expects it, so the log is kept out of the output. */
function silenceReactErrorLog(): void {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
}
