import { CogniteClient, type ViewDefinition } from '@cognite/sdk';

export function makeMockClient(project = 'asset-passport-test'): CogniteClient {
  return { project } as Partial<CogniteClient> as CogniteClient;
}

/** A real SDK client that never reaches the network; tests spy on its methods. */
export function makeOfflineSdkClient(
  project = 'asset-passport-test',
): CogniteClient {
  return new CogniteClient({
    appId: 'asset-passport-test',
    project,
    oidcTokenProvider: () => Promise.resolve('test-token'),
  });
}

export function stubViewList(client: CogniteClient, views: ViewDefinition[]) {
  const viewList = {
    autoPagingToArray: vi.fn(() => Promise.resolve(views)),
  } as Partial<ReturnType<typeof client.views.list>> as ReturnType<
    typeof client.views.list
  >;

  return vi.spyOn(client.views, 'list').mockReturnValue(viewList);
}
