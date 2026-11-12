import { CogniteClient, type DataModel, type ViewDefinition } from '@cognite/sdk';

export function makeMockClient(project = 'asset-passport-test'): CogniteClient {
  return { project } as Partial<CogniteClient> as CogniteClient;
}

export function makeOfflineSdkClient(project = 'asset-passport-test'): CogniteClient {
  return new CogniteClient({
    appId: 'asset-passport-test',
    project,
    oidcTokenProvider: () => Promise.resolve('test-token'),
  });
}

export function stubModelViews(client: CogniteClient, views: ViewDefinition[]) {
  const model = { views } as Partial<DataModel> as DataModel;

  return vi.spyOn(client.dataModels, 'retrieve').mockResolvedValue({ items: [model] });
}
