import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../../../hooks/assets/useAssetEquipmentDetails';
import { makeInstanceDetails } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetTopbar } from '../AssetTopbar';

const selectedAsset = { space: 'asset-instance-space', externalId: 'FLOC-100' };

describe(AssetTopbar.name, () => {
  let mockContext: UseAssetEquipmentDetailsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      getAssetEquipmentDetails: vi.fn(() =>
        Promise.resolve({ asset: makeInstanceDetails(), equipment: [] }),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetEquipmentDetailsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetEquipmentDetailsContext.Provider>
    );
  });

  it('shows the ADNOC Gas logo', () => {
    render(<AssetTopbar />, { wrapper });

    expect(screen.getByRole('img', { name: 'ADNOC Gas logo' })).toHaveAttribute(
      'src',
      '/adnoc-horizontal-white-logo.svg',
    );
  });

  it('has no breadcrumb until an asset is selected', () => {
    render(<AssetTopbar />, { wrapper });

    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('shows the external id while the asset name loads, then the name', async () => {
    render(<AssetTopbar selectedAsset={selectedAsset} />, { wrapper });

    expect(screen.getByText('FLOC-100')).toBeInTheDocument();
    expect(await screen.findByText('Cooling Water Pump')).toBeInTheDocument();
  });
});
