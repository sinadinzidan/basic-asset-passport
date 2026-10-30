import type { HostAppAPI } from '@cognite/app-sdk';
import { CogniteSdkProvider } from '@cognite/app-sdk/react';
import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { AssetListContext, useAssetList } from '../useAssetList';
import type { AssetListContextType } from '../useAssetList';

it('loads assets through the authenticated SDK and exposes project context', async () => {
  const client = new CogniteClient({ appId: 'test', project: 'test-project', getToken: async () => 'test-token' });
  const listAssets = vi.spyOn(client.instances, 'query').mockResolvedValue({ items: { assets: [] }, nextCursor: {} });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const api = {
    getProject: async () => 'test-project',
    getBaseUrl: async () => 'https://cdf.test',
    getAccessToken: async () => 'test-token',
    getAppId: async () => 'test',
  } as Partial<HostAppAPI> as HostAppAPI;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CogniteSdkProvider deps={{
          connectToHostApp: async () => ({ api }),
          createClient: () => client,
        }}>
          {children}
        </CogniteSdkProvider>
      </QueryClientProvider>
    );
  }

  const { result } = renderHook(useAssetList, { wrapper: Wrapper });
  await waitFor(() => expect(result.current?.isSuccess).toBe(true));
  expect(result.current.project).toBe('test-project');
  expect(result.current.data).toEqual({ items: [], nextCursor: {} });
  expect(listAssets).toHaveBeenCalledWith(expect.objectContaining({
    with: { assets: { limit: 10, nodes: { filter: { hasData: [{ type: 'view', space: 'energy_dm', externalId: 'EnergyAsset', version: 'v1' }] } } } },
  }));
  listAssets.mockRestore();
});

it('reconstructs preceding query cursors to load a requested page', async () => {
  const client = new CogniteClient({ appId: 'test', project: 'test-project', getToken: async () => 'test-token' });
  const listAssets = vi.spyOn(client.instances, 'query')
    .mockResolvedValueOnce({ items: { assets: [] }, nextCursor: { assets: 'opaque/next+=' } })
    .mockResolvedValueOnce({ items: { assets: [] }, nextCursor: {} });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const api = {
    getProject: async () => 'test-project',
    getBaseUrl: async () => 'https://cdf.test',
    getAccessToken: async () => 'test-token',
    getAppId: async () => 'test',
  } as Partial<HostAppAPI> as HostAppAPI;

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CogniteSdkProvider deps={{
          connectToHostApp: async () => ({ api }),
          createClient: () => client,
        }}>
          {children}
        </CogniteSdkProvider>
      </QueryClientProvider>
    );
  }

  const { result } = renderHook(() => useAssetList(1), { wrapper: Wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(listAssets.mock.calls[0]?.[0]).not.toHaveProperty('cursors');
  expect(listAssets).toHaveBeenNthCalledWith(2, expect.objectContaining({
    cursors: { assets: 'opaque/next+=' },
  }));
});

it('asks the search API only for the matches the page needs, through injected dependencies', async () => {
  const client = new CogniteClient({ appId: 'test', project: 'test-project', getToken: async () => 'test-token' });
  const matches = Array.from({ length: 11 }, (_value, index) => ({ id: `p${index}`, space: 'assets', externalId: `P-${index}`, name: `Pump ${index}` }));
  const deps: AssetListContextType = {
    useCogniteSdk: vi.fn(() => client),
    searchAssets: vi.fn(async (_client: unknown, _query: string, limit?: number) => matches.slice(0, limit)),
    fetchAssets: vi.fn(),
    fetchAssetEquipment: vi.fn(),
    fetchRelatedFiles: vi.fn(),
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}><AssetListContext.Provider value={deps}>{children}</AssetListContext.Provider></QueryClientProvider>
  );

  const { result } = renderHook(() => useAssetList(0, 'pump'), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(deps.searchAssets).toHaveBeenCalledWith(client, 'pump', 11);
  expect(result.current.data).toMatchObject({ hasMore: true, isSearchLimited: false });
  expect(result.current.data?.items).toHaveLength(10);
});
