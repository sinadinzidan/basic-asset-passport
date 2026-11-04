import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseAssetsContext,
  type UseAssetsContextType,
} from '../../../hooks/assets/useAssets';
import { makeAssetListItem, makeAssetPage } from '../../../mocks/assets';
import { makeMockClient } from '../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import { AssetTable } from '../AssetTable';

describe(AssetTable.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let onAssetSelect: (asset: { space: string; externalId: string }) => void;

  beforeEach(() => {
    mockContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
    };
    onAssetSelect = vi.fn();
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAssetsContext.Provider>
    );
  });

  it('shows placeholder counts while the first page loads', () => {
    vi.mocked(mockContext.listAssets).mockReturnValue(new Promise(() => {}));

    render(<AssetTable onAssetSelect={onAssetSelect} />, { wrapper });

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

    render(<AssetTable onAssetSelect={onAssetSelect} />, { wrapper });

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

    render(<AssetTable onAssetSelect={onAssetSelect} />, { wrapper });

    expect(await screen.findByText('No assets found')).toBeInTheDocument();
  });

  it('offers a retry when assets cannot be loaded', async () => {
    vi.mocked(mockContext.listAssets).mockRejectedValueOnce(
      new Error('failed'),
    );

    render(<AssetTable onAssetSelect={onAssetSelect} />, { wrapper });

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

    render(<AssetTable onAssetSelect={onAssetSelect} />, { wrapper });
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
});
