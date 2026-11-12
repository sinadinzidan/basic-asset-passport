import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import type { ComponentProps } from 'react';

import { AgentHelper } from './components/agents';
import { AppAlert, LoadingNotice, NeonStage } from './components/general';
import { MockAppContent } from './components/general/MockAppContent';
import {
  HOST_CONNECTING_MESSAGE,
  HOST_CONNECTION_ERROR_DESCRIPTION,
  HOST_CONNECTION_ERROR_TITLE,
} from './constants/labels';
import { AppAlertVariant } from './enums/appAlertVariant';
import { useHostConnection } from './hooks/general/useHostConnection';
import { Assets } from './pages/assets/Assets';
import { AgentProvider } from './providers/agents/AgentProvider';
import { AssetProvider } from './providers/assets/AssetProvider';
import { NavigationProvider } from './providers/general/NavigationProvider';
import type { MockContexts } from './types/mockContext';

type AppDependencies = NonNullable<ComponentProps<typeof CogniteSdkProvider>['deps']>;
type AppProps = {
  deps?: AppDependencies;
  mockContexts?: MockContexts;
};

const defaultCreateClient: AppDependencies['createClient'] = (config) => new CogniteClient(config);

const loadingFallback = (
  <main className="flex min-h-screen items-center justify-center px-6 text-base-foreground">
    <LoadingNotice className="px-8 py-6" message={HOST_CONNECTING_MESSAGE} />
  </main>
);

const errorFallback = (
  <main className="flex min-h-screen w-full items-center px-6 text-base-foreground">
    <AppAlert variant={AppAlertVariant.ERROR} title={HOST_CONNECTION_ERROR_TITLE}>
      {HOST_CONNECTION_ERROR_DESCRIPTION}
    </AppAlert>
  </main>
);

function App({ deps, mockContexts }: AppProps) {
  const { hostState, getHostConnection } = useHostConnection(
    deps?.connectToHostApp ?? connectToHostAppImpl,
  );
  const createClient = deps?.createClient ?? defaultCreateClient;

  if (mockContexts) {
    return (
      <NeonStage>
        <MockAppContent mockContexts={mockContexts} />
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
        {hostState && (
          <NavigationProvider api={hostState.api} initialState={hostState.initialState}>
            <AssetProvider>
              <Assets />
            </AssetProvider>
            <AgentProvider>
              <AgentHelper />
            </AgentProvider>
          </NavigationProvider>
        )}
      </CogniteSdkProvider>
    </NeonStage>
  );
}

export default App;
