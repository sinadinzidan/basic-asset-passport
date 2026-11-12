import { useCallback, useRef, useState } from 'react';

import type { ConnectToHost, HostConnection, HostState } from '../../types/host';

export function useHostConnection(connectToHost: ConnectToHost) {
  const [hostState, setHostState] = useState<HostState | null>(null);
  const connectionReference = useRef<Promise<HostConnection> | null>(null);

  const getHostConnection = useCallback((): Promise<HostConnection> => {
    if (connectionReference.current === null) {
      connectionReference.current = connectToHost().then((connection) => {
        setHostState({ api: connection.api, initialState: connection.initialState });
        return connection;
      });
    }

    return connectionReference.current;
  }, [connectToHost]);

  return { hostState, getHostConnection };
}
