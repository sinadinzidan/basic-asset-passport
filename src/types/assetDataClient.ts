import type { CogniteClient } from '@cognite/sdk';

/**
 * The part of the SDK client the asset, note and document services use. The real
 * CogniteClient satisfies it as is; mock mode supplies an implementation that
 * answers the same requests with dummy data.
 */
export type AssetDataClient = {
  project: string;
  dataModels: Pick<CogniteClient['dataModels'], 'retrieve'>;
  instances: Pick<
    CogniteClient['instances'],
    'query' | 'search' | 'upsert' | 'delete'
  >;
  profiles: Pick<CogniteClient['profiles'], 'me'>;
};
