import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '../App';
import { ASSET_VIEW_LABELS } from '../constants/labels';
import { AssetView } from '../enums/assetView';


type AppDeps = NonNullable<ComponentProps<typeof App>['deps']>;

function renderApp(result: string[] | Error, nextPage?: string[], nextPageDelayMs: number = 0, initialState?: string, equipmentNames: string[] = []) {
  let listAssets: ReturnType<typeof vi.spyOn>;
  let searchAssets: ReturnType<typeof vi.spyOn>;
  const syncInternalState = vi.fn(async (_state: string) => true);
  const deps: AppDeps = {
    connectToHostApp: vi.fn<AppDeps['connectToHostApp']>(() =>
      Promise.resolve({
        initialState,
        api: {
          getProject: () => Promise.resolve('flows-builder'),
          getBaseUrl: () => Promise.resolve('https://cognite.test'),
          getAccessToken: () => Promise.resolve('test-token'),
          getAppId: () => Promise.resolve('test-app-id'),
          syncInternalState,
        } as Partial<HostAppAPI> as HostAppAPI,
      })
    ),
    createClient: (config) => {
      const client = new CogniteClient(config);
      searchAssets = vi.spyOn(client.instances, 'search').mockResolvedValue({ items: [] });
      vi.spyOn(client.files, 'retrieve').mockRejectedValue(new Error('File content unavailable'));
      const spy = vi.spyOn(client.instances, 'query');
      if (result instanceof Error) {
        spy.mockRejectedValue(result);
      } else if (initialState) {
        spy.mockImplementation(async (request): Promise<Awaited<ReturnType<typeof client.instances.query>>> => (
          'equipment' in request.with
            ? { items: { equipment: equipmentNames.map((name) => ({
              instanceType: 'node' as const, space: 'asset_data', externalId: name, version: 1, createdTime: 0, lastUpdatedTime: 0,
              properties: { energy_dm: { 'EnergyEquipment/v1': { name: `Motor ${name}` } } },
            })) }, nextCursor: {} }
            : { items: { files: [] }, nextCursor: {} }
        ));
      } else {
        spy.mockResolvedValueOnce({
          items: { assets: result.map((name) => ({
            instanceType: 'node',
            space: 'asset_data',
            externalId: name,
            version: 1,
            createdTime: 0,
            lastUpdatedTime: 0,
            properties: { energy_dm: { 'EnergyAsset/v1': { name } } },
          })) },
          nextCursor: nextPage ? { assets: 'opaque/next+=' } : {},
        });
        if (nextPage) {
          const nextPageResponse: Awaited<ReturnType<typeof client.instances.query>> = {
            items: { assets: nextPage.map((name) => ({
              instanceType: 'node' as const,
              space: 'asset_data',
              externalId: name,
              version: 1,
              createdTime: 0,
              lastUpdatedTime: 0,
              properties: { energy_dm: { 'EnergyAsset/v1': { name } } },
            })) },
            nextCursor: {},
          };
          if (nextPageDelayMs > 0) {
            spy.mockImplementationOnce(async () => {
              await new Promise<void>((resolve) => setTimeout(resolve, nextPageDelayMs));
              return nextPageResponse;
            });
          } else {
            spy.mockResolvedValueOnce(nextPageResponse);
          }
        }
      }
      listAssets = spy;
      return client;
    },
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App deps={deps} />
    </QueryClientProvider>
  );
  return {
    getListAssets: () => listAssets,
    getSearchAssets: () => searchAssets,
    syncInternalState,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('CDF asset page', () => {
  it('switches page tabs and saves the selected tab without losing asset state', async () => {
    const user = userEvent.setup();
    const selectedAsset = { space: 'asset_data', externalId: 'A-1', name: 'Feed pump' };
    const { syncInternalState } = renderApp([], undefined, 0, JSON.stringify({
      selectedAsset, assetPage: 2, assetSearch: 'pump',
    }));
    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('tab', { name: 'Signals' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Documents/ }));
    expect(syncInternalState).toHaveBeenLastCalledWith(JSON.stringify({
      assetSearch: 'pump', assetPage: 2, selectedAsset, passportTab: 'documents',
    }));
    expect(screen.getByRole('tabpanel', { name: /^Documents/ })).toBeInTheDocument();
  });

  it('restores a search from the host and reports no matches without hiding the search field', async () => {
    const { getSearchAssets } = renderApp([], undefined, 0, '{"assetSearch":"compressor"}');
    expect(await screen.findByText('No assets match “compressor”')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show all assets' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toHaveValue('compressor');
    expect(getSearchAssets()).toHaveBeenCalledWith(expect.objectContaining({ query: 'compressor' }));
  });

  it('offers to show every asset again from the no-match state', async () => {
    const user = userEvent.setup();
    const { syncInternalState } = renderApp([], undefined, 0, '{"assetSearch":"compressor"}');
    await user.click(await screen.findByRole('button', { name: 'Show all assets' }));
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
  });

  it('requests only as many search matches as the page needs and preserves the term in host state', async () => {
    const user = userEvent.setup();
    const { getSearchAssets, syncInternalState } = renderApp(['Initial asset']);
    await screen.findByRole('button', { name: 'Open Initial asset' });
    getSearchAssets().mockResolvedValue({ items: Array.from({ length: 11 }, (_value: unknown, index: number) => ({
      instanceType: 'node', space: 'assets', externalId: `P-${index}`, version: 1, createdTime: 0, lastUpdatedTime: 0,
      properties: { energy_dm: { 'EnergyAsset/v1': { name: `Pump ${index}` } } },
    })) });
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump{Enter}');
    await screen.findByRole('button', { name: 'Open Pump 0' });
    expect(screen.queryByRole('button', { name: 'Open Pump 10' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByRole('button', { name: 'Open Pump 10' });
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Showing 11 (last page)')).toBeInTheDocument();
    expect(getSearchAssets().mock.calls.map(([request]: [{ limit: number }]) => request.limit)).toEqual([11, 21]);
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetSearch":"pump","assetPage":1}');
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await screen.findByRole('button', { name: 'Open Pump 0' });
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetSearch":"pump"}');
  });

  it('keeps search available on request failures and allows clearing the failed query', async () => {
    const user = userEvent.setup();
    const { getSearchAssets } = renderApp(['Initial asset']);
    await screen.findByRole('button', { name: 'Open Initial asset' });
    getSearchAssets().mockRejectedValue(new Error('Search forbidden'));
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump{Enter}');
    expect(await screen.findByText('Failed to load assets: Search forbidden')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByRole('button', { name: 'Open Initial asset' })).toBeInTheDocument();
  });

  it('searches beyond the current page, resets pagination, preserves search on return, and clears it', async () => {
    const user = userEvent.setup();
    const { getListAssets, getSearchAssets, syncInternalState } = renderApp(['Page one'], ['Page two']);
    await screen.findByRole('button', { name: 'Open Page one' });
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findByRole('button', { name: 'Open Page two' });
    getSearchAssets().mockResolvedValue({ items: [{
      instanceType: 'node', space: 'asset_data', externalId: 'P-99', version: 1, createdTime: 0, lastUpdatedTime: 0,
      properties: { energy_dm: { 'EnergyAsset/v1': { name: 'Remote pump' } } },
    }] });
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('button', { name: 'Open Remote pump' });
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetSearch":"pump"}');
    getListAssets().mockResolvedValue({ items: { equipment: [], files: [] }, nextCursor: {} });
    await user.click(screen.getByRole('button', { name: 'Open Remote pump' }));
    await user.click(await screen.findByRole('button', { name: 'Asset Passport' }));
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toHaveValue('pump');
    await screen.findByRole('button', { name: 'Open Remote pump' });
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByRole('button', { name: 'Open Page one' })).toBeInTheDocument();
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
  });

  it('changes the results per page, returns to the first page and keeps the choice in the shared link', async () => {
    const user = userEvent.setup();
    const { getListAssets, syncInternalState } = renderApp(['Page one']);
    await screen.findByRole('button', { name: 'Open Page one' });
    getListAssets().mockResolvedValue({ items: { assets: [] }, nextCursor: {} });
    await user.click(screen.getByRole('combobox', { name: 'Results per page' }));
    await user.click(await screen.findByRole('option', { name: '25' }));
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetPageSize":25}');
    expect(getListAssets()).toHaveBeenLastCalledWith(expect.objectContaining({
      with: { assets: expect.objectContaining({ limit: 25 }) },
    }));
  });

  it('switches to the grid view and keeps it in the shared link and across search', async () => {
    const user = userEvent.setup();
    const { syncInternalState } = renderApp(['Feed pump']);
    await screen.findByRole('button', { name: 'Open Feed pump' });
    await user.click(screen.getByRole('tab', { name: ASSET_VIEW_LABELS[AssetView.GRID] }));
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetView":"grid"}');
    expect(screen.getByRole('list', { name: 'Assets' })).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump{Enter}');
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetView":"grid","assetSearch":"pump"}');
    await user.click(screen.getByRole('tab', { name: ASSET_VIEW_LABELS[AssetView.LIST] }));
    expect(syncInternalState).toHaveBeenLastCalledWith('{"assetSearch":"pump"}');
  });

  it('restores the selected equipment from the shared link and saves a new choice', async () => {
    const user = userEvent.setup();
    const selectedAsset = { space: 'asset_data', externalId: 'A-1', name: 'Feed pump' };
    const equipmentId = (name: string) => JSON.stringify(['asset_data', name]);
    const { syncInternalState } = renderApp([], undefined, 0, JSON.stringify({ selectedAsset, selectedEquipmentId: equipmentId('M-2') }), ['M-1', 'M-2']);
    expect(await screen.findByRole('heading', { name: 'Motor M-2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Motor M-1/ }));
    expect(await screen.findByRole('heading', { name: 'Motor M-1' })).toBeInTheDocument();
    expect(JSON.parse(String(syncInternalState.mock.lastCall?.[0]))).toEqual({ selectedAsset, selectedEquipmentId: equipmentId('M-1') });
  });

  it('lists assets using the authenticated CDF SDK without the boilerplate', async () => {
    const { getListAssets } = renderApp(['Feed pump']);
    expect(await screen.findAllByText('Feed pump')).not.toHaveLength(0);
    expect(getListAssets()).toHaveBeenCalledWith(expect.objectContaining({
      with: { assets: { limit: 10, nodes: { filter: { hasData: [{ type: 'view', space: 'energy_dm', externalId: 'EnergyAsset', version: 'v1' }] } } } },
    }));
    expect(screen.queryByText('Welcome to Flows custom apps')).not.toBeInTheDocument();
  });

  it('paginates through Data Modeling cursors and syncs the page to Fusion', async () => {
    const user = userEvent.setup();
    const { getListAssets, syncInternalState } = renderApp(['Page one'], ['Page two'], 100);
    expect(await screen.findAllByText('Page one')).not.toHaveLength(0);
    expect(screen.getByText('Page 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Loading page 2…')).toBeInTheDocument();
    expect(screen.getAllByText('Page one')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
    expect(await screen.findAllByText('Page two')).not.toHaveLength(0);
    expect(screen.queryByText('Loading page 2…')).not.toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(getListAssets()).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursors: { assets: 'opaque/next+=' },
    }));
    expect(syncInternalState).toHaveBeenCalledWith('{"assetPage":1}');

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findAllByText('Page one')).not.toHaveLength(0);
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await screen.findAllByText('Page two');
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(await screen.findAllByText('Page one')).not.toHaveLength(0);
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
  });

  it('opens the equipment page from an asset and shows no-data when no equipment is linked', async () => {
    const user = userEvent.setup();
    const { getListAssets, syncInternalState } = renderApp(['P-101']);

    await screen.findByRole('button', { name: 'Open P-101' });
    getListAssets()
      .mockResolvedValueOnce({ items: { equipment: [] }, nextCursor: {} })
      .mockResolvedValueOnce({ items: { files: [] }, nextCursor: {} });
    await user.click(screen.getByRole('row', { name: /P-101/ }));
    expect(await screen.findByRole('heading', { name: 'P-101' })).toBeInTheDocument();
    expect(await screen.findByText('No equipment linked to this asset')).toBeInTheDocument();
    expect(getListAssets()).toHaveBeenCalledWith(expect.objectContaining({
      with: { equipment: expect.objectContaining({ nodes: { filter: { and: expect.arrayContaining([
        { equals: { property: ['energy_dm', 'EnergyEquipment/v1', 'asset'], value: { space: 'asset_data', externalId: 'P-101' } } },
      ]) } } }) },
    }));
    expect(syncInternalState).toHaveBeenCalledWith('{"selectedAsset":{"space":"asset_data","externalId":"P-101","name":"P-101"}}');

    await user.click(screen.getByRole('button', { name: 'Asset Passport' }));
    expect(await screen.findAllByText('P-101')).not.toHaveLength(0);
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
  });

  it('shows an empty state', async () => {
    renderApp([]);
    expect(await screen.findByText('No assets found')).toBeInTheDocument();
  });

  it('restores a file preview from Fusion and removes only the file selection on close', async () => {
    const user = userEvent.setup();
    const initialState = {
      assetPage: 2,
      selectedAsset: { space: 'asset_data', externalId: 'P-101', name: 'Feed pump' },
      selectedFile: { space: 'files', externalId: 'PID-1', name: 'Plant P&ID' },
    };
    const { syncInternalState } = renderApp([], undefined, 0, JSON.stringify(initialState));

    expect(await screen.findByRole('dialog', { name: 'Plant P&ID' })).toBeInTheDocument();
    expect(await screen.findByText('Failed to load file: File content unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close file viewer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(syncInternalState).toHaveBeenLastCalledWith(JSON.stringify({
      assetPage: 2, selectedAsset: initialState.selectedAsset,
    }));
    expect(screen.getByRole('heading', { name: 'Feed pump' })).toBeInTheDocument();
  });

  it('offers a way back to the first page when a saved page no longer exists', async () => {
    const user = userEvent.setup();
    const { syncInternalState } = renderApp(new Error('This asset page is no longer available. Return to the first page.'), undefined, 0, '{"assetPage":4}');
    expect(await screen.findByText(/no longer available/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Go to first page' }));
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
    expect(screen.queryByRole('button', { name: 'Go to first page' })).not.toBeInTheDocument();
  });

  it('shows CDF request errors', async () => {
    renderApp(new Error('Access denied'));
    expect(await screen.findByText('Failed to load assets: Access denied')).toBeInTheDocument();
  });
});
