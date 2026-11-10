import {
  connectToHostApp as connectToHostAppImpl,
  type HostAppAPI,
} from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import type { ComponentProps } from 'react';
import { useCallback, useRef, useState } from 'react';

import { AgentChatStateProvider } from './components/agents/AgentChatStateProvider';
import { AgentHelper } from './components/agents/AgentHelper';
import { LiveAgentClientProvider } from './components/agents/LiveAgentClientProvider';
import { LiveAssetDataClientProvider } from './components/assets/LiveAssetDataClientProvider';
import { AppAlert } from './components/general/AppAlert';
import { LoadingNotice } from './components/general/LoadingNotice';
import { MockModeNotice } from './components/general/MockModeNotice';
import { NeonStage } from './components/general/NeonStage';
import { AgentClientContext } from './hooks/agents/useAgentClient';
import { DocumentFileClientContext } from './hooks/assets/documents/useDocumentFileClient';
import { AssetDataClientContext } from './hooks/assets/useAssetDataClient';
import { TimeseriesDatapointsClientContext } from './hooks/timeseries/useTimeseriesDatapointsClient';
import { AssetRegister } from './pages/assets/AssetRegister';
import type { AgentClient } from './types/agent';
import type { AssetDataClient } from './types/assetDataClient';
import type { DocumentFileClient } from './types/documentFileClient';
import type { StateSyncApi } from './types/host';
import type { TimeseriesDatapointsClient } from './types/timeseries';

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
  /** Dummy file operations for the documents in mock mode. */
  mockDocumentFileClient?: DocumentFileClient;
  /** Dummy readings for the timeseries previews in mock mode. */
  mockTimeseriesDatapointsClient?: TimeseriesDatapointsClient;
  /** Dummy agents for the agent helper in mock mode. */
  mockAgentClient?: AgentClient;
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
    <AppAlert variant="error" title="Could not connect to Cognite">
      Refresh the app to try again.
    </AppAlert>
  </main>
);

function App({
  deps,
  mockDataClient,
  mockDocumentFileClient,
  mockTimeseriesDatapointsClient,
  mockAgentClient,
}: AppProps) {
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
      <NeonStage>
        <MockModeNotice />
        <AssetDataClientContext.Provider value={mockDataClient}>
          <DocumentFileClientContext.Provider
            value={mockDocumentFileClient ?? null}
          >
            <TimeseriesDatapointsClientContext.Provider
              value={mockTimeseriesDatapointsClient ?? null}
            >
              <AssetRegister api={null} />
            </TimeseriesDatapointsClientContext.Provider>
          </DocumentFileClientContext.Provider>
        </AssetDataClientContext.Provider>
        {mockAgentClient ? (
          <AgentClientContext.Provider value={mockAgentClient}>
            <AgentChatStateProvider>
              <AgentHelper />
            </AgentChatStateProvider>
          </AgentClientContext.Provider>
        ) : null}
      </NeonStage>
    );
  }

  return (
    <NeonStage>
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
        <LiveAgentClientProvider>
          <AgentChatStateProvider>
            <AgentHelper />
          </AgentChatStateProvider>
        </LiveAgentClientProvider>
      </CogniteSdkProvider>
    </NeonStage>
  );
}

export default App;
