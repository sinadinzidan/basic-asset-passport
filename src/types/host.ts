import type { HostAppAPI } from '@cognite/app-sdk';

export type StateSyncApi = Pick<HostAppAPI, 'syncInternalState'>;
