import { createContext, useContext } from 'react';

import type { TimeseriesContextType } from '../../../types/timeseries';

export const TimeseriesClientContext = createContext<TimeseriesContextType | null>(null);

export function useTimeseriesClient(): TimeseriesContextType {
  const client = useContext(TimeseriesClientContext);

  if (client === null) {
    throw new Error('useTimeseriesClient must be used inside a TimeseriesClientContext provider.');
  }

  return client;
}
