import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';

import type { NavigationStore } from '../../types/navigation';

export type NavigationDeps = {
  logError: (message: string, error: unknown) => void;
  now: () => number;
};

const defaultDeps: NavigationDeps = {
  logError: (message, error) => console.error(message, error),
  now: () => Date.now(),
};

export const NavigationContext = createContext<NavigationDeps>(defaultDeps);

export const NavigationStoreContext = createContext<StoreApi<NavigationStore> | null>(null);

export function useNavigationState<Slice>(select: (store: NavigationStore) => Slice): Slice {
  const store = useContext(NavigationStoreContext);

  if (store === null) {
    throw new Error('useNavigationState must be used inside a NavigationProvider.');
  }

  return useStore(store, select);
}
