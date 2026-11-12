import type { CogniteClient } from '@cognite/sdk';

export type AssetContextType = {
  project: string;
  dataModels: Pick<CogniteClient['dataModels'], 'retrieve'>;
  instances: Pick<
    CogniteClient['instances'],
    'query' | 'search' | 'aggregate' | 'upsert' | 'delete'
  >;
  profiles: Pick<CogniteClient['profiles'], 'me'>;
};
