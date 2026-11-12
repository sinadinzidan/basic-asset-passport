import { useContext, useState, type ReactNode } from 'react';

import {
  NavigationContext,
  NavigationStoreContext,
  type NavigationDeps,
} from '../../hooks/general/useNavigationState';
import { parseNavigationState } from '../../lib/navigationState';
import { createNavigationStore } from '../../store/navigation';
import type { StateSyncApi } from '../../types/host';
import type { NavigationState } from '../../types/navigation';

type NavigationProviderProps = {
  api: StateSyncApi | null;
  initialState?: string;
  children: ReactNode;
};

export function NavigationProvider({ api, initialState, children }: NavigationProviderProps) {
  const { logError, now } = useContext(NavigationContext);

  const [store] = useState(() => {
    const onChange = createHostSync(api, logError);

    return createNavigationStore({
      initialState: parseNavigationState(initialState),
      timeseriesChartClockMs: now(),
      ...(onChange ? { onChange } : {}),
    });
  });

  return (
    <NavigationStoreContext.Provider value={store}>{children}</NavigationStoreContext.Provider>
  );
}

function createHostSync(
  api: StateSyncApi | null,
  logError: NavigationDeps['logError'],
): ((navigationState: NavigationState) => void) | null {
  if (api === null) return null;

  return (navigationState) => {
    void api.syncInternalState(JSON.stringify(navigationState)).catch((error: unknown) => {
      logError('Failed to sync navigation state.', error);
    });
  };
}
