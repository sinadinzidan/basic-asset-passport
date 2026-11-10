import { createContext, useContext } from 'react';

import type { TimeseriesChartOptions } from '../../../types/asset';

export type TimeseriesChartState = {
  /** The setup of the open chart; null while it is closed. */
  options: TimeseriesChartOptions | null;
  /** Opens the chart with this setup, or closes it when given none. */
  onChange: (options: TimeseriesChartOptions | null) => void;
};

/**
 * Where the open chart is kept. The asset page provides it from the
 * host-synced navigation state, so a reload or shared link restores the chart.
 * Without a provider the chart simply stays closed.
 */
export const TimeseriesChartStateContext = createContext<TimeseriesChartState>({
  options: null,
  onChange: () => {},
});

export function useTimeseriesChartState(): TimeseriesChartState {
  return useContext(TimeseriesChartStateContext);
}
