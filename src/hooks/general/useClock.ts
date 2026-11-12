import { createContext, useContext } from 'react';

const defaultDeps = { now: () => Date.now() };

export type ClockContextType = typeof defaultDeps;
export const ClockContext = createContext<ClockContextType>(defaultDeps);

export function useClock(): ClockContextType['now'] {
  return useContext(ClockContext).now;
}
