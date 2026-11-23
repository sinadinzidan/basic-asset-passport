import { useMemo } from 'react';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import type { ThreeDLoadProgress } from '../../types/threeD';

export const EMPTY_THREE_D_PROGRESS: ThreeDLoadProgress = {
  loadedSectors: 0,
  failedSectors: 0,
  skippedSectors: 0,
  totalSectors: 0,
  triangleCount: 0,
  unsupported: {},
};

export function useThreeDLoadProgress() {
  const store = useMemo(() => createStore<ThreeDLoadProgress>()(() => EMPTY_THREE_D_PROGRESS), []);
  const progress = useStore(store);

  const actions = useMemo(
    () => ({
      setProgress: (next: ThreeDLoadProgress) => store.setState(next, true),
      resetProgress: () => store.setState(EMPTY_THREE_D_PROGRESS, true),
    }),
    [store],
  );

  return { progress, ...actions };
}
