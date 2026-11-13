import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetSummaryContext } from '../../../__mocks__/assetSummary';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { AssetClientContext } from '../../../hooks/assets/useAssetClient';
import { UseAssetSummaryContext } from '../../../hooks/assets/useAssetSummary';
import type { AssetSummaryService } from '../../../services/assets/assetSummary';
import { AssetSummary } from '../AssetSummary';

describe(AssetSummary.name, () => {
  const client = makeMockClient();
  let context: AssetSummaryService;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    context = makeAssetSummaryContext();
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <AssetClientContext.Provider value={client}>
        <UseAssetSummaryContext.Provider value={{ createAssetSummaryService: () => context }}>
          <QueryWrapper>{children}</QueryWrapper>
        </UseAssetSummaryContext.Provider>
      </AssetClientContext.Provider>
    );
  });

  it('shows three cards for the whole asset table: assets, operating and equipment', async () => {
    render(<AssetSummary />, { wrapper });

    const summary = screen.getByRole('region', { name: 'Register summary' });

    expect(within(summary).getAllByRole('group')).toHaveLength(3);
    expect(
      await within(within(summary).getByRole('group', { name: 'Assets' })).findByText('4,210'),
    ).toBeInTheDocument();
    expect(
      await within(within(summary).getByRole('group', { name: 'Operating' })).findByText('3,800'),
    ).toBeInTheDocument();
    expect(
      await within(within(summary).getByRole('group', { name: 'Equipment' })).findByText('18,500'),
    ).toBeInTheDocument();
  });

  it('shows a placeholder in each card while its count is being read', () => {
    vi.mocked(context.countAllAssets).mockReturnValue(new Promise(() => {}));
    vi.mocked(context.countOperatingAssets).mockReturnValue(new Promise(() => {}));
    vi.mocked(context.countAllEquipment).mockReturnValue(new Promise(() => {}));

    render(<AssetSummary />, { wrapper });

    expect(screen.getAllByText('–')).toHaveLength(3);
  });

  it('shows a placeholder only in the card whose count could not be read', async () => {
    vi.mocked(context.countAllEquipment).mockRejectedValue(new Error('forbidden'));

    render(<AssetSummary />, { wrapper });

    expect(
      await within(screen.getByRole('group', { name: 'Assets' })).findByText('4,210'),
    ).toBeInTheDocument();
    expect(
      await within(screen.getByRole('group', { name: 'Operating' })).findByText('3,800'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Equipment' })).getByText('–'),
    ).toBeInTheDocument();
  });

  it('says that a count could not be read, with the reason', async () => {
    vi.mocked(context.countAllEquipment).mockRejectedValue(new Error('forbidden'));

    render(<AssetSummary />, { wrapper });

    const alert = await screen.findByRole('alert');

    expect(within(alert).getByText('Some counts could not be loaded')).toBeInTheDocument();
    expect(within(alert).getByText('Reason: forbidden')).toBeInTheDocument();
  });

  it('shows no error while every count can be read', async () => {
    render(<AssetSummary />, { wrapper });

    await screen.findByText('18,500');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reads a failed count again on Retry', async () => {
    vi.mocked(context.countAllEquipment).mockRejectedValueOnce(new Error('forbidden'));
    render(<AssetSummary />, { wrapper });

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('18,500')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
