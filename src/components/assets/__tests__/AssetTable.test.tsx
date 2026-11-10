import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ASSET_SEARCH_LIMIT } from '../../../constants/assets';
import {
  UseAssetsContext,
  type UseAssetsContextType,
} from '../../../hooks/assets/useAssets';
import {
  DebounceContext,
  type DebounceDeps,
} from '../../../hooks/general/useDebouncedCallback';
import { makeAssetListItem, makeAssetPage } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetTable } from '../AssetTable';

// Applies the typed search on the next tick instead of after the real pause.
const immediateDebounce: DebounceDeps = {
  setTimer: (callback) => setTimeout(callback, 0),
  clearTimer: (handle) => clearTimeout(handle),
};

describe(AssetTable.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let onAssetSelect: (asset: { space: string; externalId: string }) => void;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
      searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    onAssetSelect = vi.fn();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <DebounceContext.Provider value={immediateDebounce}>
        <UseAssetsContext.Provider value={mockContext}>
          <QueryWrapper>{children}</QueryWrapper>
        </UseAssetsContext.Provider>
      </DebounceContext.Provider>
    );
  });

  it('shows placeholder counts while the first page loads', () => {
    vi.mocked(mockContext.listAssets).mockReturnValue(new Promise(() => {}));

    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      screen.getByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('–')).toHaveLength(2);
  });

  it('counts operating and other statuses on the current page', async () => {
    const items = [
      makeAssetListItem({ externalId: 'A', flocStatus: 'Operating' }),
      makeAssetListItem({ externalId: 'B', flocStatus: 'operating ' }),
      makeAssetListItem({ externalId: 'C', flocStatus: 'IN SERVICE' }),
    ];
    vi.mocked(mockContext.listAssets).mockResolvedValue(makeAssetPage(items));

    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );

    const summary = await screen.findByRole('region', {
      name: 'Current page summary',
    });
    await waitFor(() =>
      expect(
        within(summary).getByText('Operating').nextSibling,
      ).toHaveTextContent('2'),
    );
    expect(
      within(summary).getByText('Other statuses').nextSibling,
    ).toHaveTextContent('1');
  });

  it('shows the empty state when the view has no assets', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(makeAssetPage([]));

    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(await screen.findByText('No assets found')).toBeInTheDocument();
  });

  it('offers a retry when assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValueOnce(
      new Error('failed'),
    );

    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );

    expect(
      await screen.findByText('Assets could not be loaded'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('heading', { name: 'Asset register' }),
    ).toBeInTheDocument();
    expect(mockContext.listAssets).toHaveBeenCalledTimes(2);
  });

  it('pages forward and back with the cursors of each page', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(
      makeAssetPage([makeAssetListItem()], 'cursor-2'),
    );

    render(
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
      />,
      { wrapper },
    );
    const nextButton = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(nextButton).toBeEnabled());

    await userEvent.click(nextButton);

    await waitFor(() =>
      expect(mockContext.listAssets).toHaveBeenLastCalledWith(
        client,
        'cursor-2',
      ),
    );
    expect(await screen.findByText('Page 2')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Previous page' }),
    );

    expect(await screen.findByText('Page 1')).toBeInTheDocument();
  });

  it('shows the search field while the first page loads', () => {
    vi.mocked(mockContext.listAssets).mockReturnValue(new Promise(() => {}));

    renderTable();

    expect(
      screen.getByRole('searchbox', { name: 'Search assets' }),
    ).toBeInTheDocument();
  });

  it('keeps the search field when assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValue(new Error('failed'));

    renderTable();

    expect(
      await screen.findByText('Assets could not be loaded'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Search assets' }),
    ).toBeEnabled();
  });

  it('reports the typed text to the page', async () => {
    const onSearchChange = vi.fn();
    renderTable({ onSearchChange });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search assets' }),
      'pump',
    );

    await waitFor(() => expect(onSearchChange).toHaveBeenCalledWith('pump'));
  });

  it('searches for the text of the page instead of listing', async () => {
    const found = makeAssetPage([makeAssetListItem({ externalId: 'FOUND' })]);
    vi.mocked(mockContext.searchAssets).mockResolvedValue(found);

    renderTable({ searchQuery: 'pump' });

    await waitFor(() =>
      expect(mockContext.searchAssets).toHaveBeenCalledWith(client, 'pump'),
    );
    expect(mockContext.listAssets).not.toHaveBeenCalled();
    expect(screen.getByRole('searchbox')).toHaveValue('pump');
  });

  it('has no paging while searching', async () => {
    renderTable({ searchQuery: 'pump' });

    await screen.findByRole('searchbox');

    expect(
      screen.queryByRole('button', { name: 'Next page' }),
    ).not.toBeInTheDocument();
  });

  it('says when nothing matches the search', async () => {
    vi.mocked(mockContext.searchAssets).mockResolvedValue(makeAssetPage([]));

    renderTable({ searchQuery: 'zzz' });

    expect(await screen.findByText('No matching assets')).toBeInTheDocument();
    expect(screen.getByText(/zzz/)).toBeInTheDocument();
  });

  it('says when the search shows only the first matches', async () => {
    const items = Array.from({ length: ASSET_SEARCH_LIMIT }, (_, index) =>
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

  it('goes back to the first page when the search changes', async () => {
    vi.mocked(mockContext.listAssets).mockResolvedValue(
      makeAssetPage([makeAssetListItem()], 'cursor-2'),
    );
    renderTable();
    const nextButton = await screen.findByRole('button', { name: 'Next page' });
    await waitFor(() => expect(nextButton).toBeEnabled());
    await userEvent.click(nextButton);
    expect(await screen.findByText('Page 2')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), 'p');

    expect(await screen.findByText('Page 1')).toBeInTheDocument();
  });

  function tableElement(overrides: Partial<TableProps> = {}) {
    return (
      <AssetTable
        onAssetSelect={onAssetSelect}
        searchQuery=""
        onSearchChange={vi.fn()}
        {...overrides}
      />
    );
  }

  function renderTable(overrides: Partial<TableProps> = {}) {
    return render(tableElement(overrides), { wrapper });
  }
});

type TableProps = ComponentProps<typeof AssetTable>;
