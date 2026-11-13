import type { HostAppAPI } from '@cognite/app-sdk';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeNodeInstance,
  makeQueryResponse,
  makeViewDefinition,
  TEST_VIEW_SPACE,
} from '../__mocks__/cdf';
import { makeOfflineSdkClient, stubModelViews } from '../__mocks__/cogniteClient';
import { makeMockAgentContext } from '../__mocks__/mockAgentContext';
import { makeMockAssetContext, makeMockDocumentFileContext } from '../__mocks__/mockAssetContext';
import { makeMockTimeseriesContext } from '../__mocks__/mockTimeseriesContext';
import { makeQueryClientWrapper } from '../__mocks__/QueryClientWrapper';
import App from '../App';
import { ASSISTANT_LABEL } from '../constants/agents';
import { APP_LOGO_SOURCE } from '../constants/branding';
import { AssetTab } from '../enums/assetTab';
import type { MockContexts } from '../types/mockContext';

type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

const selectedAsset = {
  space: 'asset-instance-space',
  externalId: 'asset-node-100',
};

describe(App.name, () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.classList.remove('dark');
  });

  it('renders the app header above the asset register', async () => {
    const { deps } = makeDeps();

    renderApp(deps);

    const header = await screen.findByRole('banner');

    expect(header).not.toHaveTextContent('Asset Passport');
    expect(screen.getByRole('img', { name: 'ADNOC Gas logo' })).toHaveAttribute(
      'src',
      APP_LOGO_SOURCE,
    );
    expect(screen.queryByLabelText('Signed-in user')).not.toBeInTheDocument();
  });

  it('shows a loading status while connecting to the host', () => {
    const { deps } = makeDeps();

    vi.mocked(deps.connectToHostApp).mockReturnValue(new Promise(() => {}));

    renderApp(deps);

    expect(screen.getByRole('status')).toHaveTextContent('Connecting to Cognite...');
  });

  it('tells the user to refresh when the host connection fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { deps } = makeDeps();

    vi.mocked(deps.connectToHostApp).mockRejectedValue(new Error('no host'));

    renderApp(deps);

    expect(await screen.findByText('Could not connect to Cognite')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Refresh the app to try again.');
  });

  it('shows the selected asset name in the header without breadcrumb actions', async () => {
    const { deps } = makeDeps(
      JSON.stringify({
        selectedAsset,
        activeAssetTab: AssetTab.PROPERTIES,
      }),
    );

    renderApp(deps);

    const header = await screen.findByRole('banner');

    expect(await within(header).findByText('Cooling Water Pump')).toBeInTheDocument();
    expect(
      within(header).queryByRole('button', {
        name: 'Actions for asset asset-node-100',
      }),
    ).not.toBeInTheDocument();
    expect(within(header).queryByText('Copy Asset ID')).not.toBeInTheDocument();
  });

  it('renders the asset grid and queries ten instances from the Asset view', async () => {
    const { deps, query } = makeDeps();

    renderApp(deps);

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Assets' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Functional location' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Plant' })).toHaveAttribute(
      'aria-colindex',
      '1',
    );
    expect(screen.getByRole('columnheader', { name: 'Description' })).toBeInTheDocument();
    await waitFor(() => expect(query).toHaveBeenCalled());
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        with: {
          assets: expect.objectContaining({
            limit: 10,
            nodes: {
              filter: {
                hasData: [
                  {
                    type: 'view',
                    space: TEST_VIEW_SPACE,
                    externalId: 'Asset',
                    version: 'test-version',
                  },
                ],
              },
            },
          }),
        },
        select: {
          assets: {
            sources: [
              expect.objectContaining({
                properties: expect.arrayContaining([
                  'name',
                  'plantName',
                  'flocStatus',
                  'abcIndicatorName',
                ]),
              }),
            ],
          },
        },
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(query).toHaveBeenCalledTimes(2));
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        cursors: { assets: 'next-page-cursor' },
      }),
    );
  });

  it('serves dummy data without connecting to the host in mock mode', async () => {
    const { deps } = makeDeps();
    const QueryWrapper = makeQueryClientWrapper();

    render(
      <QueryWrapper>
        <App deps={deps} mockContexts={makeMockContexts()} />
      </QueryWrapper>,
    );

    expect(await screen.findByText(/showing dummy data/i)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    expect(deps.connectToHostApp).not.toHaveBeenCalled();
  });

  it('keeps the mascot in mock mode, whose panel says the assistant is not available', async () => {
    const { deps } = makeDeps();
    const QueryWrapper = makeQueryClientWrapper();
    const user = userEvent.setup();

    render(
      <QueryWrapper>
        <App deps={deps} mockContexts={makeMockContexts()} />
      </QueryWrapper>,
    );
    await user.click(await screen.findByRole('button', { name: ASSISTANT_LABEL }));

    expect(await screen.findByText(/assistant is not available/i)).toBeInTheDocument();
  });

  it('does not show the mock notice when talking to CDF', async () => {
    const { deps } = makeDeps();

    renderApp(deps);

    await screen.findByRole('heading', { name: 'Asset register' });
    expect(screen.queryByText(/showing dummy data/i)).not.toBeInTheDocument();
  });

  it('restores and syncs the selected Equipment tab', async () => {
    const { deps, syncInternalState } = makeDeps(
      JSON.stringify({
        selectedAsset,
        activeAssetTab: AssetTab.EQUIPMENTS,
      }),
    );

    renderApp(deps);

    expect(await screen.findByRole('tab', { name: /equipment/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /equipment/i }).querySelectorAll('[data-slot="badge"]'),
      ).toHaveLength(1),
    );
    expect(await screen.findByText('Equipment ID: equipment-node-100')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cooling Water Pump', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to assets' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Properties' }));

    await waitFor(() =>
      expect(syncInternalState).toHaveBeenLastCalledWith(
        JSON.stringify({
          selectedAsset,
          activeAssetTab: AssetTab.PROPERTIES,
        }),
      ),
    );
  });
});

function renderApp(deps: AppDeps) {
  const QueryWrapper = makeQueryClientWrapper();

  return render(
    <QueryWrapper>
      <App deps={deps} />
    </QueryWrapper>,
  );
}

function makeMockContexts(): MockContexts {
  const assetContext = makeMockAssetContext(0);

  return {
    assetContext,
    documentFileContext: makeMockDocumentFileContext(assetContext),
    timeseriesContext: makeMockTimeseriesContext(),
    agentContext: makeMockAgentContext(),
  };
}

function makeDeps(initialState?: string) {
  const client = makeOfflineSdkClient();
  const assetView = makeViewDefinition('Asset', {
    name: { label: 'Name' },
    description: { label: 'Description' },
  });
  const equipmentView = makeViewDefinition('Equipment', {
    name: { label: 'Name' },
    equipmentId: { label: 'Equipment ID' },
  });
  const assetNode = makeNodeInstance(assetView, selectedAsset, {
    name: 'Cooling Water Pump',
    description: 'North process cooling system',
    plantName: 'North Plant',
    flocStatus: 'IN SERVICE',
    abcIndicatorName: 'A - High criticality',
  });
  const equipmentNode = makeNodeInstance(
    equipmentView,
    { space: 'equipment-instance-space', externalId: 'equipment-node-100' },
    { name: 'Cooling Water Pump', equipmentId: 'P-100' },
  );

  stubModelViews(client, [assetView, equipmentView]);
  const query = vi
    .spyOn(client.instances, 'query')
    .mockResolvedValue(
      makeQueryResponse(
        { assets: [assetNode], asset: [assetNode], equipment: [equipmentNode] },
        { assets: 'next-page-cursor' },
      ),
    );

  vi.spyOn(client.instances, 'aggregate').mockResolvedValue({
    items: [{ instanceType: 'node', aggregates: [{ aggregate: 'count', value: 1 }] }],
  });
  const syncInternalState = vi.fn<HostAppAPI['syncInternalState']>(() => Promise.resolve(true));
  const api = {
    getProject: vi.fn<HostAppAPI['getProject']>(() => Promise.resolve('sub-cgnt-adg-idi-dev')),
    getBaseUrl: vi.fn<HostAppAPI['getBaseUrl']>(() => Promise.resolve('https://cognite.test')),
    getAccessToken: vi.fn<HostAppAPI['getAccessToken']>(() => Promise.resolve('test-token')),
    getAppId: vi.fn<HostAppAPI['getAppId']>(() => Promise.resolve('test-app-id')),
    syncInternalState,
  } as Partial<HostAppAPI> as HostAppAPI;

  const deps: AppDeps = {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        api,
        ...(initialState === undefined ? {} : { initialState }),
      }),
    ),
    createClient: vi.fn<AppDeps['createClient']>(() => client),
  };

  return { deps, query, syncInternalState };
}
