import { connectToHostApp } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import { LazyMotion } from 'motion/react';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';

import { ErrorBoundary } from './components/general/ErrorBoundary';
import { LoadingNotice } from './components/general/LoadingNotice';
import { RetryAlert } from './components/general/RetryAlert';
import { Dashboard } from './pages/dashboard/Dashboard';

const loadMotionFeatures = () => import('./lib/motionFeatures').then((module) => module.default);

type AppProps = {
  deps?: ComponentProps<typeof CogniteSdkProvider>['deps'];
};

function App({ deps }: AppProps) {
  const [connection, setConnection] = useState<Awaited<ReturnType<typeof connectToHostApp>>>();

  const providerDeps = useMemo(() => ({
    connectToHostApp: async () => {
      const result = await (deps?.connectToHostApp ?? connectToHostApp)();
      setConnection(result);
      return result;
    },
    createClient: deps?.createClient ?? ((config: ConstructorParameters<typeof CogniteClient>[0]) => new CogniteClient(config)),
  }), [deps]);

  return (
    <div className="min-h-screen bg-background text-foreground">
        <CogniteSdkProvider
          deps={providerDeps}
          loadingFallback={
            <LoadingNotice label="Connecting to CDF" className="p-6" />
          }
          errorFallback={
            <div className="p-6">
              <RetryAlert message="Failed to connect to Fusion host. Open this app inside Cognite Fusion." />
            </div>
          }
        >
          {connection && (
            <ErrorBoundary>
              <LazyMotion features={loadMotionFeatures} strict>
                <Dashboard api={connection.api} initialState={connection.initialState} />
              </LazyMotion>
            </ErrorBoundary>
          )}
        </CogniteSdkProvider>
    </div>
  );
}

export default App;
