import { createContext, useContext } from 'react';

import type { ThreeDContextType } from '../../types/threeDContext';

export const ThreeDClientContext = createContext<ThreeDContextType | null>(null);

export function useThreeDClient(): ThreeDContextType {
  const client = useContext(ThreeDClientContext);

  if (client === null) {
    throw new Error('useThreeDClient must be used inside a ThreeDClientContext provider.');
  }

  return client;
}
