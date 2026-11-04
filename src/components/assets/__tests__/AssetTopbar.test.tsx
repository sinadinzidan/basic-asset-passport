import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      useCogniteSdk: vi.fn(() => makeMockClient()),
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

  it.each([
    ['light', '/adnoc-horizontal-blue-logo.svg'],
    ['dark', '/adnoc-horizontal-white-logo.svg'],
  ] as const)('shows the %s theme logo', (theme, source) => {
    render(<AssetTopbar theme={theme} onThemeChange={vi.fn()} />, { wrapper });

    expect(screen.getByRole('img', { name: 'ADNOC Gas logo' })).toHaveAttribute(
      'src',
      source,
    );
  });

  it('has no breadcrumb until an asset is selected', () => {
    render(<AssetTopbar theme="light" onThemeChange={vi.fn()} />, { wrapper });

    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });

  it('shows the external id while the asset name loads, then the name', async () => {
    render(
      <AssetTopbar
        selectedAsset={selectedAsset}
        theme="light"
        onThemeChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(screen.getByText('FLOC-100')).toBeInTheDocument();
    expect(await screen.findByText('Cooling Water Pump')).toBeInTheDocument();
  });

  it('reports a theme chosen from the switcher', async () => {
    const onThemeChange = vi.fn();
    render(<AssetTopbar theme="light" onThemeChange={onThemeChange} />, {
      wrapper,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Toggle theme' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Dark mode' }),
    );

    expect(onThemeChange).toHaveBeenCalledWith('dark');
  });
});
