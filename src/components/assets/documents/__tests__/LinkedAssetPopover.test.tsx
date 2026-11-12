import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import {
  UseAssetDetailsContext,
  type UseAssetDetailsContextType,
} from '../../../../hooks/assets/useAssetDetails';
import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import { LinkedAssetPopover } from '../LinkedAssetPopover';

const assetContext = makeMockClient();

const linkedAsset = { space: 'asset-space', externalId: 'FLOC-9' };

describe(LinkedAssetPopover.name, () => {
  let context: UseAssetDetailsContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let anchor: HTMLElement;

  beforeEach(() => {
    anchor = document.createElement('div');
    document.body.appendChild(anchor);
    context = {
      getAssetDetails: vi.fn(() =>
        Promise.resolve(
          makeInstanceDetails({
            ...linkedAsset,
            properties: [
              { identifier: 'name', label: 'Name', value: 'Feed Pump 9' },
              { identifier: 'description', label: 'Description', value: 'Feeds the boiler' },
              { identifier: 'plantName', label: 'Plant', value: 'South Plant' },
              { identifier: 'flocStatus', label: 'Status', value: 'Operating' },
              {
                identifier: 'abcIndicatorName',
                label: 'Criticality',
                value: 'A - High criticality',
              },
            ],
          }),
        ),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDetailsContext.Provider value={context}>
        <QueryWrapper>
          <AssetContext.Provider value={assetContext}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetDetailsContext.Provider>
    );
  });

  afterEach(() => {
    anchor.remove();
  });

  function renderPopover(overrides: Partial<React.ComponentProps<typeof LinkedAssetPopover>> = {}) {
    const properties = {
      target: { asset: linkedAsset, anchor },
      onClose: vi.fn(),
      onOpenAsset: vi.fn(),
      ...overrides,
    };
    render(<LinkedAssetPopover {...properties} />, { wrapper });
    return properties;
  }

  it('shows nothing while no annotation has been clicked', () => {
    renderPopover({ target: null });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(context.getAssetDetails).not.toHaveBeenCalled();
  });

  it('shows the linked asset with its status, criticality and description', async () => {
    renderPopover();

    expect(await screen.findByRole('heading', { name: 'Feed Pump 9' })).toBeInTheDocument();
    expect(screen.getByText('Operating')).toBeInTheDocument();
    expect(screen.getByText('A - High criticality')).toBeInTheDocument();
    expect(screen.getByText('Feeds the boiler')).toBeInTheDocument();
    expect(screen.getByText('South Plant')).toBeInTheDocument();
    expect(screen.getByText('FLOC-9')).toBeInTheDocument();
    expect(context.getAssetDetails).toHaveBeenCalledWith(expect.anything(), linkedAsset);
  });

  it('says it is loading while the asset is read', () => {
    vi.mocked(context.getAssetDetails).mockReturnValue(new Promise(() => {}));

    renderPopover();

    expect(screen.getByText('Loading asset...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open asset' })).not.toBeInTheDocument();
  });

  it('offers a retry when the asset cannot be read', async () => {
    vi.mocked(context.getAssetDetails).mockRejectedValue(new Error('not found'));

    renderPopover();

    expect(await screen.findByText('Asset could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Reason: not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open asset' })).not.toBeInTheDocument();
  });

  it('opens the asset in the app', async () => {
    const user = userEvent.setup();
    const { onOpenAsset } = renderPopover();

    await user.click(await screen.findByRole('button', { name: 'Open asset' }));

    expect(onOpenAsset).toHaveBeenCalledExactlyOnceWith(linkedAsset);
  });

  it('closes from its close button without opening the asset', async () => {
    const user = userEvent.setup();
    const { onClose, onOpenAsset } = renderPopover();
    await screen.findByRole('heading', { name: 'Feed Pump 9' });

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
    expect(onOpenAsset).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();
    await screen.findByRole('heading', { name: 'Feed Pump 9' });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('stays open when the clicked box itself is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderPopover();
    await screen.findByRole('heading', { name: 'Feed Pump 9' });

    await user.click(anchor);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes when something else on the page is pressed', async () => {
    const user = userEvent.setup();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const { onClose } = renderPopover();
    await screen.findByRole('heading', { name: 'Feed Pump 9' });

    await user.click(outside);

    expect(onClose).toHaveBeenCalled();
    outside.remove();
  });
});
