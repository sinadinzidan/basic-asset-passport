import { createContext, useContext } from 'react';

import type { TimeseriesDatapointsClient } from '../../types/timeseries';

export const TimeseriesDatapointsClientContext =
  createContext<TimeseriesDatapointsClient | null>(null);

export function useTimeseriesDatapointsClient(): TimeseriesDatapointsClient {
  const client = useContext(TimeseriesDatapointsClientContext);

  if (client === null) {
    throw new Error(
      'useTimeseriesDatapointsClient must be used inside a TimeseriesDatapointsClientContext provider.',
    );
  }

  return client;
}
