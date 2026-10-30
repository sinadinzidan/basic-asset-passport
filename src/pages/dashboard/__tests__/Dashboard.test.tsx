import type { HostAppAPI } from '@cognite/app-sdk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DARK_THEME_CLASS_NAME } from '../../../constants/theme';
import { AssetListViewModelContext } from '../../../hooks/assets/useAssetListViewModel';
import type { AssetListViewModelContextType } from '../../../hooks/assets/useAssetListViewModel';
import { EquipmentPageViewModelContext } from '../../../hooks/assets/useEquipmentPageViewModel';
import type { EquipmentPageViewModelContextType } from '../../../hooks/assets/useEquipmentPageViewModel';
import { Dashboard } from '../Dashboard';

type AssetListResult = ReturnType<AssetListViewModelContextType['useAssetList']>;
type EquipmentResult = ReturnType<EquipmentPageViewModelContextType['useAssetEquipment']>;
type FilesResult = ReturnType<EquipmentPageViewModelContextType['useRelatedFiles']>;

describe('Dashboard', () => {
  it('lists live assets with the live data label', async () => {
    renderDashboard();
    expect(screen.getByRole('banner')).toHaveTextContent('Asset Passport');
    expect(screen.getByText('Read-only')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assets' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Open Feed pump' })).toBeInTheDocument();
  });

  it('opens the selected asset and syncs the view to the host', async () => {
    const user = userEvent.setup();
    const { syncInternalState } = renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Open Feed pump' }));
    expect(screen.getByRole('heading', { name: 'Equipment under Feed pump' })).toBeInTheDocument();
    expect(syncInternalState).toHaveBeenLastCalledWith(JSON.stringify({
      selectedAsset: { space: 'energy', externalId: 'P-1', name: 'Feed pump' },
    }));
  });

  it('restores the selected asset from the host initial state and returns to the list', async () => {
    const user = userEvent.setup();
    const { syncInternalState } = renderDashboard(JSON.stringify({ selectedAsset: { space: 'energy', externalId: 'P-1', name: 'Feed pump' } }));
    expect(screen.getByRole('heading', { name: 'Equipment under Feed pump' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent('Feed pump');
    await user.click(screen.getByRole('button', { name: 'Asset Passport' }));
    expect(await screen.findByRole('heading', { name: 'Assets' })).toBeInTheDocument();
    expect(syncInternalState).toHaveBeenLastCalledWith('{}');
  });

  it('switches the theme from the topbar and applies it to the document', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole('button', { name: 'Toggle theme' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Dark mode/ }));
    expect(document.documentElement).toHaveClass(DARK_THEME_CLASS_NAME);
    document.documentElement.classList.remove(DARK_THEME_CLASS_NAME);
  });

  it('warns when the view could not be saved to the shared link', async () => {
    const user = userEvent.setup();
    renderDashboard(undefined, vi.fn(async () => false));
    await user.click(await screen.findByRole('button', { name: 'Open Feed pump' }));
    expect(screen.getByText('Could not save this view to the shared link.')).toBeInTheDocument();
  });

  it('warns when saving the view to the host throws', async () => {
    const user = userEvent.setup();
    renderDashboard(undefined, vi.fn(async () => { throw new Error('Host unavailable'); }));
    await user.click(await screen.findByRole('button', { name: 'Open Feed pump' }));
    expect(screen.getByText('Could not save this view to the shared link.')).toBeInTheDocument();
  });
});

function renderDashboard(initialState?: string, syncInternalState: HostAppAPI['syncInternalState'] = vi.fn(async () => true)) {
  const assetList: AssetListViewModelContextType = {
    useAssetList: vi.fn(() => ({
      data: { items: [{ id: 'p1', space: 'energy', externalId: 'P-1', name: 'Feed pump' }], hasMore: false },
      isLoading: false, isFetching: false, error: null, refetch: vi.fn(),
    } as Partial<AssetListResult> as AssetListResult)),
  };
  const equipmentPage: EquipmentPageViewModelContextType = {
    useCogniteSdk: vi.fn(),
    useAssetEquipment: vi.fn(() => ({ data: undefined, isFetching: true, error: null, refetch: vi.fn() } as Partial<EquipmentResult> as EquipmentResult)),
    useRelatedFiles: vi.fn(() => ({ data: undefined, isLoading: false, isFetching: false, error: null, refetch: vi.fn() } as Partial<FilesResult> as FilesResult)),
  };
  render(
    <AssetListViewModelContext.Provider value={assetList}>
      <EquipmentPageViewModelContext.Provider value={equipmentPage}>
        <Dashboard api={{ syncInternalState }} initialState={initialState} />
      </EquipmentPageViewModelContext.Provider>
    </AssetListViewModelContext.Provider>
  );
  return { syncInternalState };
}
