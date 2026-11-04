import {
  connectToHostApp as connectToHostAppImpl,
  type HostAppAPI,
} from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { CogniteClient } from '@cognite/sdk';
import type { ComponentProps } from 'react';
import { useCallback, useRef, useState } from 'react';

import { LiveAssetDataClientProvider } from './components/assets/LiveAssetDataClientProvider';
import { LoadingNotice } from './components/general/LoadingNotice';
import { MockModeNotice } from './components/general/MockModeNotice';
import { AssetDataClientContext } from './hooks/assets/useAssetDataClient';
import { AssetRegister } from './pages/assets/AssetRegister';
import type { AssetDataClient } from './types/assetDataClient';
import type { StateSyncApi } from './types/host';

type AppDependencies = NonNullable<
  ComponentProps<typeof CogniteSdkProvider>['deps']
>;
type HostConnection = Awaited<ReturnType<AppDependencies['connectToHostApp']>>;
type AppHostState = {
  api: HostAppAPI;
  initialState?: string;
};
type AppProps = {
  deps?: AppDependencies;
  /** Dummy-data client for mock mode; skips the Fusion host connection. */
  mockDataClient?: AssetDataClient;
};

const defaultCreateClient: AppDependencies['createClient'] = (config) =>
  new CogniteClient(config);

const loadingFallback = (
  <main className="flex min-h-screen items-center justify-center px-6 text-base-foreground">
    <LoadingNotice className="px-8 py-6" message="Connecting to Cognite..." />
  </main>
);

const errorFallback = (
  <main className="flex min-h-screen w-full items-center px-6 text-base-foreground">
    <Alert variant="error">
      <AlertDescription>
        Could not connect to Cognite. Refresh the app to try again.
      </AlertDescription>
    </Alert>
  </main>
);

function App({ deps, mockDataClient }: AppProps) {
  const [hostState, setHostState] = useState<AppHostState | null>(null);
  const hostConnectionRef = useRef<Promise<HostConnection> | null>(null);

  const connectToHostApp = deps?.connectToHostApp ?? connectToHostAppImpl;
  const createClient = deps?.createClient ?? defaultCreateClient;
  const stateSyncApi: StateSyncApi | null = hostState?.api ?? null;

  // The provider and the app share one host connection, which also keeps
  // React StrictMode's double effect run from connecting twice.
  const getHostConnection = useCallback(() => {
    if (hostConnectionRef.current === null) {
      hostConnectionRef.current = connectToHostApp().then((connection) => {
        setHostState({
          api: connection.api,
          initialState: connection.initialState,
        });
        return connection;
      });
    }

    return hostConnectionRef.current;
  }, [connectToHostApp]);

  if (mockDataClient) {
    return (
      <div className="app-backdrop min-h-screen text-base-foreground">
        <MockModeNotice />
        <AssetDataClientContext.Provider value={mockDataClient}>
          <AssetRegister api={null} />
        </AssetDataClientContext.Provider>
      </div>
    );
  }

  return (
    <div className="app-backdrop min-h-screen text-base-foreground">
      <CogniteSdkProvider
        loadingFallback={loadingFallback}
        errorFallback={errorFallback}
        deps={{ connectToHostApp: getHostConnection, createClient }}
      >
        <LiveAssetDataClientProvider>
          <AssetRegister
            api={stateSyncApi}
            initialState={hostState?.initialState}
          />
        </LiveAssetDataClientProvider>
      </CogniteSdkProvider>
    </div>
  );
}

export default App;
