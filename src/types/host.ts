import type { connectToHostApp, HostAppAPI } from '@cognite/app-sdk';

export type StateSyncApi = Pick<HostAppAPI, 'syncInternalState'>;

export type HostConnection = Awaited<ReturnType<typeof connectToHostApp>>;

export type ConnectToHost = () => Promise<HostConnection>;

export type HostState = {
  api: HostAppAPI;
  initialState?: string;
};
