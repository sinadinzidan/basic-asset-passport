import { CogniteError } from '@cognite/sdk';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { ASSET_SEARCH_LIMIT } from '../../../constants/assets';
import { AssetContext } from '../../../hooks/assets/useAssetContext';
import { UseAssetsContext, type UseAssetsContextType } from '../../../hooks/assets/useAssets';
import {
  UseAssetsKPICountsContext,
  type UseAssetsKPICountsContextType,
} from '../../../hooks/assets/useAssetsKPICounts';
import { DebounceContext, type DebounceDeps } from '../../../hooks/general/useDebouncedCallback';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { makeAssetListItem, makeAssetPage } from '../../../mocks/assets';
import { makeAssetsKPICountsContext } from '../../../mocks/assetsKPICounts';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeNavigationStore } from '../../../mocks/navigation';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import type { NavigationState, NavigationStore } from '../../../types/navigation';
import { AssetTable } from '../AssetTable';

// Applies the typed search on the next tick instead of after the real pause.
const immediateDebounce: DebounceDeps = {
  setTimer: (callback) => setTimeout(callback, 0),
  clearTimer: (handle) => clearTimeout(handle),
};

describe(AssetTable.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetsContextType;
  let countsContext: UseAssetsKPICountsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let store: StoreApi<NavigationStore>;

  beforeEach(() => {
    mockContext = {
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    countsContext = makeAssetsKPICountsContext();
    store = makeNavigationStore();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <DebounceContext.Provider value={immediateDebounce}>
          <UseAssetsContext.Provider value={mockContext}>
            <UseAssetsKPICountsContext.Provider value={countsContext}>
              <QueryWrapper>
                <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
              </QueryWrapper>
            </UseAssetsKPICountsContext.Provider>
          </UseAssetsContext.Provider>
        </DebounceContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('shows the counts of the whole register, not of the page', async () => {
    const items = [
      makeAssetListItem({ externalId: 'A', flocStatus: 'Operating' }),
      makeAssetListItem({ externalId: 'B', flocStatus: 'IN SERVICE' }),
    ];
    vi.mocked(mockContext.listAssets).mockResolvedValue(makeAssetPage(items));

    renderTable();

    const summary = await screen.findByRole('region', {
      name: 'Register summary',
    });
    expect(await findCardValue(summary, 'Assets', '4,210')).toBeInTheDocument();
    expect(await findCardValue(summary, 'Operating', '3,800')).toBeInTheDocument();
    expect(await findCardValue(summary, 'Equipment', '18,500')).toBeInTheDocument();
  });

  it('keeps the counts of the register while the search narrows the table', async () => {
    renderTable({ searchQuery: 'pump' });

    const summary = await screen.findByRole('region', {
      name: 'Register summary',
    });
    expect(await findCardValue(summary, 'Assets', '4,210')).toBeInTheDocument();
    expect(countsContext.countAllAssets).toHaveBeenCalledOnce();
  });

  it('lists the assets without waiting for the counts', async () => {
    vi.mocked(countsContext.countAllAssets).mockReturnValue(new Promise(() => {}));
    vi.mocked(countsContext.countOperatingAssets).mockReturnValue(new Promise(() => {}));
    vi.mocked(countsContext.countAllEquipment).mockReturnValue(new Promise(() => {}));
    vi.mocked(mockContext.listAssets).mockResolvedValue(makeAssetPage([]));

    renderTable();

    expect(await screen.findByText('No assets found')).toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(3);
  });

  it('shows the empty state when the view has no assets', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(makeAssetPage([]));

    renderTable();

    expect(await screen.findByText('No assets found')).toBeInTheDocument();
  });

  it('offers a retry when assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValueOnce(new Error('failed'));

    renderTable();

    expect(await screen.findByText('Assets could not be loaded')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
    expect(mockContext.listAssets).toHaveBeenCalledTimes(2);
  });

  it('shows the reason assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(
      new Error('The Asset_Passport data model was not found in sp-asset-passport.'),
    );

    renderTable();

    expect(
      await screen.findByText(
        'Reason: The Asset_Passport data model was not found in sp-asset-passport.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Check access to the Asset view, then try again.')).toBeInTheDocument();
  });

  it('shows the reason a later page cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(
      new CogniteError('Invalid cursor', 400, 'request-1'),
    );

    renderTable({ registerCursors: ['stale-cursor'] });

    expect(await screen.findByText('Reason: Invalid cursor (HTTP 400)')).toBeInTheDocument();
    expect(
      screen.getByText('This page may no longer exist. Try again, or go back to the first page.'),
    ).toBeInTheDocument();
  });

  it('reads the page of the last cursor and shows its number', async () => {
    renderTable({ registerCursors: ['cursor-2', 'cursor-3'] });

    expect(await screen.findByText('Page 3')).toBeInTheDocument();
    expect(mockContext.listAssets).toHaveBeenLastCalledWith(client, 'cursor-3');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled(),
    );
  });

  it('reads the first page without a cursor', async () => {
    renderTable();

    expect(await screen.findByText('Page 1')).toBeInTheDocument();
    expect(mockContext.listAssets).toHaveBeenLastCalledWith(client, undefined);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  it('goes to the page of the next cursor when Next is chosen', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(
      makeAssetPage([makeAssetListItem()], 'cursor-2'),
    );
    renderTable();
    const nextButton = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(nextButton).toBeEnabled());

    await userEvent.click(nextButton);

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
  });

  it('goes back a page when Previous is chosen', async () => {
    renderTable({ registerCursors: ['cursor-2', 'cursor-3'] });
    const previousButton = await screen.findByRole('button', {
      name: 'Previous page',
    });
    await waitFor(() => expect(previousButton).toBeEnabled());

    await userEvent.click(previousButton);

    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
    expect(await screen.findByText('Page 2')).toBeInTheDocument();
  });

  it('offers the first page when a later page cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(new Error('failed'));
    renderTable({ registerCursors: ['stale-cursor'] });

    await userEvent.click(await screen.findByRole('button', { name: 'Go to first page' }));

    expect(store.getState().navigationState.registerCursors).toBeUndefined();
  });

  it('does not offer the first page when the first page cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(new Error('failed'));
    renderTable();

    await screen.findByText('Assets could not be loaded');
    expect(screen.queryByRole('button', { name: 'Go to first page' })).not.toBeInTheDocument();
  });

  it('shows the search field while the first page loads', () => {
    vi.mocked(mockContext.listAssets).mockReturnValue(new Promise(() => {}));

    renderTable();

    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toBeInTheDocument();
  });

  it('keeps the search field when assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(new Error('failed'));

    renderTable();

    expect(await screen.findByText('Assets could not be loaded')).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toBeEnabled();
  });

  it('searches for the typed text', async () => {
    renderTable();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'pump');

    await waitFor(() => expect(store.getState().navigationState.searchQuery).toBe('pump'));
    await waitFor(() => expect(mockContext.searchAssets).toHaveBeenCalledWith(client, 'pump'));
  });

  it('searches for the text of the page instead of listing', async () => {
    const found = makeAssetPage([makeAssetListItem({ externalId: 'FOUND' })]);
    vi.mocked(mockContext.searchAssets).mockResolvedValue(found);

    renderTable({ searchQuery: 'pump' });

    await waitFor(() => expect(mockContext.searchAssets).toHaveBeenCalledWith(client, 'pump'));
    expect(mockContext.listAssets).not.toHaveBeenCalled();
    expect(screen.getByRole('searchbox')).toHaveValue('pump');
  });

  it('has no paging while searching', async () => {
    renderTable({ searchQuery: 'pump' });

    await screen.findByRole('searchbox');

    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('says when nothing matches the search', async () => {
    vi.mocked(mockContext.searchAssets).mockResolvedValue(makeAssetPage([]));

    renderTable({ searchQuery: 'zzz' });

    expect(await screen.findByText('No matching assets')).toBeInTheDocument();
    expect(screen.getByText(/zzz/)).toBeInTheDocument();
  });

  it('says when the search shows only the first matches', async () => {
    const items = Array.from({ length: ASSET_SEARCH_LIMIT }, (_item, index) =>
      makeAssetListItem({ externalId: `FLOC-${index}` }),
    );
    vi.mocked(mockContext.searchAssets).mockResolvedValue(makeAssetPage(items));

    renderTable({ searchQuery: 'pump' });

    expect(
      await screen.findByText(
        `Showing the first ${ASSET_SEARCH_LIMIT} matches. Refine the search to narrow them.`,
      ),
    ).toBeInTheDocument();
  });

  it('stays on its page when the same search is applied again', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(
      makeAssetPage([makeAssetListItem()], 'cursor-2'),
    );
    renderTable({ registerCursors: ['cursor-2'] });
    expect(await screen.findByText('Page 2')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), '{Enter}');

    expect(screen.getByText('Page 2')).toBeInTheDocument();
    expect(store.getState().navigationState.registerCursors).toEqual(['cursor-2']);
  });

  function renderTable(navigationState: Partial<NavigationState> = {}) {
    store = makeNavigationStore(navigationState);

    return render(<AssetTable />, { wrapper });
  }
});

function findCardValue(summary: HTMLElement, card: string, value: string) {
  return within(within(summary).getByRole('group', { name: card })).findByText(value);
}
