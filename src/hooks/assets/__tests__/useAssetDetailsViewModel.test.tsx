import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetDetailsTabCountsContext } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import type { AssetDetailsService } from '../../../services/assets/assetDetails';
import { AssetContext } from '../useAssetContext';
import { UseAssetDetailsContext } from '../useAssetDetails';
import { UseAssetDetailsTabCountsContext } from '../useAssetDetailsTabCounts';
import { useAssetDetailsViewModel } from '../useAssetDetailsViewModel';

const assetIdentifier = { space: 'asset-instance-space', externalId: 'FLOC-100' };

describe(useAssetDetailsViewModel.name, () => {
  const client = makeMockClient();
  let detailsService: AssetDetailsService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    detailsService = {
      getAssetDetails: vi.fn(() =>
        Promise.resolve(
          makeInstanceDetails({
            properties: [
              { identifier: 'name', label: 'Name', value: 'Cooling Water Pump' },
              { identifier: 'flocStatus', label: 'Status', value: 'Operating' },
              { identifier: 'abcIndicatorName', label: 'Criticality', value: 'A - High' },
            ],
          }),
        ),
      ),
    };
    const countService = makeAssetDetailsTabCountsContext();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDetailsContext.Provider value={{ createAssetDetailsService: () => detailsService }}>
        <UseAssetDetailsTabCountsContext.Provider
          value={{ createAssetDetailsTabCountService: () => countService }}
        >
          <QueryWrapper>
            <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
          </QueryWrapper>
        </UseAssetDetailsTabCountsContext.Provider>
      </UseAssetDetailsContext.Provider>
    );
  });

  it('is pending, titled with the external ID, until the asset arrives', async () => {
    const { result } = renderHook(() => useAssetDetailsViewModel(assetIdentifier), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.title).toBe('FLOC-100');
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the asset with its name, status and criticality', async () => {
    const { result } = renderHook(() => useAssetDetailsViewModel(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.title).toBe('Cooling Water Pump'));
    expect(result.current.status).toBe('Operating');
    expect(result.current.criticality).toBe('A - High');
    expect(result.current.asset?.externalId).toBe('FLOC-100');
  });

  it('has no status or criticality for an asset without them', async () => {
    vi.mocked(detailsService.getAssetDetails).mockResolvedValue(
      makeInstanceDetails({ properties: [] }),
    );

    const { result } = renderHook(() => useAssetDetailsViewModel(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.title).toBe('FLOC-100');
    expect(result.current.status).toBeUndefined();
    expect(result.current.criticality).toBeUndefined();
  });

  it('counts the tabs of the asset', async () => {
    const { result } = renderHook(() => useAssetDetailsViewModel(assetIdentifier), { wrapper });

    await waitFor(() => expect(result.current.tabCounts.notes.count).toBe(2));
    expect(result.current.tabCounts.equipment.count).toBe(1);
  });

  it('reports a failed load with its error and reads again on retry', async () => {
    vi.mocked(detailsService.getAssetDetails).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderHook(() => useAssetDetailsViewModel(assetIdentifier), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.title).toBe('Cooling Water Pump'));
  });
});
