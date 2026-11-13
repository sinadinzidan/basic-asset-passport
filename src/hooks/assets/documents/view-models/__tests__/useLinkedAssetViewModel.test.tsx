import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeInstanceDetails } from '../../../../../__mocks__/assets';
import { makeMockClient } from '../../../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../../../__mocks__/QueryClientWrapper';
import type { AssetDetailsService } from '../../../../../services/assets/assetDetails';
import { AssetContext } from '../../../useAssetContext';
import { UseAssetDetailsContext } from '../../../useAssetDetails';
import { useLinkedAssetViewModel } from '../useLinkedAssetViewModel';

const linkedAsset = { space: 'asset-space', externalId: 'FLOC-9' };
const FUNCTIONAL_LOCATION = {
  identifier: 'externalId',
  label: 'Functional location',
  value: 'FLOC-9',
};

describe(useLinkedAssetViewModel.name, () => {
  const client = makeMockClient();
  let detailsService: AssetDetailsService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    detailsService = {
      getAssetDetails: vi.fn(() =>
        Promise.resolve(
          makeInstanceDetails({
            ...linkedAsset,
            properties: [
              { identifier: 'name', label: 'Name', value: 'Feed Pump 9' },
              { identifier: 'flocStatus', label: 'Status', value: 'Operating' },
              { identifier: 'abcIndicatorName', label: 'Criticality', value: 'B' },
              { identifier: 'description', label: 'Description', value: 'Feeds the boiler' },
              { identifier: 'plantName', label: 'Plant', value: 'South Plant' },
              { identifier: 'plantId', label: 'Plant ID', value: 'G307' },
            ],
          }),
        ),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <UseAssetDetailsContext.Provider value={{ createAssetDetailsService: () => detailsService }}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetDetailsContext.Provider>
    );
  });

  it('is pending, knowing only the functional location, until the asset arrives', async () => {
    const { result } = renderHook(() => useLinkedAssetViewModel(linkedAsset), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.title).toBe('FLOC-9');
    expect(result.current.details).toEqual([FUNCTIONAL_LOCATION]);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('gives the name, status and criticality, and the plant and description after the location', async () => {
    const { result } = renderHook(() => useLinkedAssetViewModel(linkedAsset), { wrapper });

    await waitFor(() => expect(result.current.title).toBe('Feed Pump 9'));
    expect(result.current.status).toBe('Operating');
    expect(result.current.criticality).toBe('B');
    expect(result.current.details).toEqual([
      FUNCTIONAL_LOCATION,
      { identifier: 'plantName', label: 'Plant', value: 'South Plant' },
      { identifier: 'description', label: 'Description', value: 'Feeds the boiler' },
    ]);
  });

  it('reports a failed load with its error and reads again on retry', async () => {
    vi.mocked(detailsService.getAssetDetails).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderHook(() => useLinkedAssetViewModel(linkedAsset), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error('no access'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.title).toBe('Feed Pump 9'));
  });
});
