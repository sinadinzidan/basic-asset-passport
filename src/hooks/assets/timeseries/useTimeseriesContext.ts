import { createContext, useContext } from 'react';

import type { TimeseriesContextType } from '../../../types/timeseries';

export const TimeseriesContext = createContext<TimeseriesContextType | null>(null);

export function useTimeseriesContext(): TimeseriesContextType {
  const client = useContext(TimeseriesContext);

  if (client === null) {
    throw new Error('useTimeseriesContext must be used inside a TimeseriesContext provider.');
  }

  return client;
}
