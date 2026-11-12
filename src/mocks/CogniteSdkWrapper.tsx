import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import type { CogniteClient } from '@cognite/sdk';
import type { ComponentProps, ComponentType, ReactNode } from 'react';

type SdkProviderDeps = NonNullable<ComponentProps<typeof CogniteSdkProvider>['deps']>;

export function makeCogniteSdkWrapper(
  client: CogniteClient,
): ComponentType<{ children: ReactNode }> {
  const api = {
    getProject: () => Promise.resolve(client.project),
    getBaseUrl: () => Promise.resolve('https://cognite.test'),
    getAppId: () => Promise.resolve('test-app-id'),
    getAccessToken: () => Promise.resolve('test-token'),
  } as Partial<HostAppAPI> as HostAppAPI;
  const deps: SdkProviderDeps = {
    connectToHostApp: () => Promise.resolve({ api }),
    createClient: () => client,
  };

  return function CogniteSdkWrapper({ children }) {
    return <CogniteSdkProvider deps={deps}>{children}</CogniteSdkProvider>;
  };
}
