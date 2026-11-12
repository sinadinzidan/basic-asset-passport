import type { CogniteClient } from '@cognite/sdk';

import type { AssetContextType } from '../types/assetContext';

import { cdfTaskRunner, type QueuedTaskRunner } from './queuedTaskRunner';

export type LimitedCdfClient = AssetContextType & Pick<CogniteClient, 'post'>;

type PostOptions = Parameters<CogniteClient['post']>[1];

export function limitCdfCalls(
  client: CogniteClient,
  runner: QueuedTaskRunner = cdfTaskRunner,
): LimitedCdfClient {
  return {
    project: client.project,
    post: <Data>(path: string, options?: PostOptions) =>
      runner.schedule(() => client.post<Data>(path, options)),
    dataModels: {
      retrieve: (...request) => runner.schedule(() => client.dataModels.retrieve(...request)),
    },
    instances: {
      query: (...request) => runner.schedule(() => client.instances.query(...request)),
      search: (...request) => runner.schedule(() => client.instances.search(...request)),
      aggregate: (...request) => runner.schedule(() => client.instances.aggregate(...request)),
      upsert: (...request) => runner.schedule(() => client.instances.upsert(...request)),
      delete: (...request) => runner.schedule(() => client.instances.delete(...request)),
    },
    profiles: {
      me: (...request) => runner.schedule(() => client.profiles.me(...request)),
    },
  };
}
