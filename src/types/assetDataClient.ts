import type { CogniteClient } from '@cognite/sdk';

/**
 * The part of the SDK client the asset services use. The real CogniteClient
 * satisfies it as is; mock mode supplies an implementation that answers the
 * same requests with dummy data.
 */
export type AssetDataClient = {
  project: string;
  views: {
    list: (
      ...args: Parameters<CogniteClient['views']['list']>
    ) => Pick<ReturnType<CogniteClient['views']['list']>, 'autoPagingToArray'>;
  };
  instances: Pick<CogniteClient['instances'], 'query'>;
};
