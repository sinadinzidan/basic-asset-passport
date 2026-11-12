import { connectToHostApp as connectToHostAppImpl } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import type { ComponentProps } from 'react';

import { AgentHelper } from './components/agents/AgentHelper';
import { AppAlert } from './components/general/AppAlert';
import { LoadingNotice } from './components/general/LoadingNotice';
import { MockAppContent } from './components/general/MockAppContent';
import { NeonStage } from './components/general/NeonStage';
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
    <LoadingNotice className="px-8 py-6" message="Connecting to Cognite..." />
  </main>
);

const errorFallback = (
  <main className="flex min-h-screen w-full items-center px-6 text-base-foreground">
    <AppAlert variant={AppAlertVariant.ERROR} title="Could not connect to Cognite">
      Refresh the app to try again.
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
