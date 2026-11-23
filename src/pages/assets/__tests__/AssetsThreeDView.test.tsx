import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetPage } from '../../../__mocks__/assets';
import { makeAssetSummaryContext } from '../../../__mocks__/assetSummary';
import { makeMockClient } from '../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { THREE_D_MODEL_REFERENCE } from '../../../constants/threeD';
import { AppView } from '../../../enums/appView';
import { AssetClientContext } from '../../../hooks/assets/useAssetClient';
import { UseAssetsContext } from '../../../hooks/assets/useAssets';
import { UseAssetSummaryContext } from '../../../hooks/assets/useAssetSummary';
import { ThreeDClientContext } from '../../../hooks/three-d/useThreeDClient';
import {
  UseAssetThreeDViewModelContext,
  type UseAssetThreeDViewModelContextType,
} from '../../../hooks/three-d/view-models/useAssetThreeDViewModel';
import { NavigationProvider } from '../../../providers/general/NavigationProvider';
import type { StateSyncApi } from '../../../types/host';
import type { ThreeDModel } from '../../../types/threeD';
import type { ThreeDContextType } from '../../../types/threeDContext';
import type { ThreeDRenderer } from '../../../types/threeDRenderer';
import { Assets } from '../Assets';

describe(`${Assets.name} sub header`, () => {
  let api: StateSyncApi;
  let threeD: ThreeDContextType;
  let renderer: ThreeDRenderer;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    const QueryWrapper = makeQueryClientWrapper();

    api = {
      syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() => Promise.resolve(true)),
    };
    threeD = {
      project: 'p',
      loadModel: vi.fn(() => Promise.resolve(makeModel())),
      loadSector: vi.fn(() => Promise.resolve(new ArrayBuffer(1))),
    };
    renderer = {
      addSector: vi.fn(),
      dispose: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      resetView: vi.fn(),
    };
    const deps: UseAssetThreeDViewModelContextType = {
      createRenderer: vi.fn(() => renderer),
      loadSectors: vi.fn(() =>
        Promise.resolve({
          loadedSectors: 0,
          failedSectors: 0,
          skippedSectors: 0,
          totalSectors: 0,
          triangleCount: 0,
          unsupported: {},
        }),
      ),
    };

    wrapper = ({ children }) => (
      <UseAssetsContext.Provider
        value={{
          createAssetService: () => ({
            listAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
            searchAssets: vi.fn(() => Promise.resolve(makeAssetPage())),
          }),
        }}
      >
        <UseAssetSummaryContext.Provider
          value={{ createAssetSummaryService: () => makeAssetSummaryContext() }}
        >
          <QueryWrapper>
            <AssetClientContext.Provider value={client}>
              <ThreeDClientContext.Provider value={threeD}>
                <UseAssetThreeDViewModelContext.Provider value={deps}>
                  {children}
                </UseAssetThreeDViewModelContext.Provider>
              </ThreeDClientContext.Provider>
            </AssetClientContext.Provider>
          </QueryWrapper>
        </UseAssetSummaryContext.Provider>
      </UseAssetsContext.Provider>
    );
  });

  it('shows Assets and 3D tabs under the header, with Assets selected', async () => {
    renderApp();

    expect(await screen.findByRole('tab', { name: 'Assets' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: '3D' })).toHaveAttribute('aria-selected', 'false');
    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
  });

  it('shows the Platform VPH model without an asset when 3D is chosen', async () => {
    const user = userEvent.setup();

    renderApp();
    await user.click(await screen.findByRole('tab', { name: '3D' }));

    expect(await screen.findByText(/Platform VPH · /)).toBeInTheDocument();
    expect(threeD.loadModel).toHaveBeenCalledWith(THREE_D_MODEL_REFERENCE);
    expect(screen.queryByRole('heading', { name: 'Asset register' })).not.toBeInTheDocument();
  });

  it('syncs the chosen view to the host', async () => {
    const user = userEvent.setup();

    renderApp();
    await user.click(await screen.findByRole('tab', { name: '3D' }));

    expect(api.syncInternalState).toHaveBeenLastCalledWith(
      expect.stringContaining(AppView.THREE_D),
    );
  });

  it('opens the 3D view restored from a shared link', async () => {
    renderApp(JSON.stringify({ activeView: AppView.THREE_D }));

    expect(await screen.findByText(/Platform VPH · /)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '3D' })).toHaveAttribute('aria-selected', 'true');
  });

  it('returns to the asset table when Assets is chosen again', async () => {
    const user = userEvent.setup();

    renderApp(JSON.stringify({ activeView: AppView.THREE_D }));
    await user.click(await screen.findByRole('tab', { name: 'Assets' }));

    expect(await screen.findByRole('heading', { name: 'Asset register' })).toBeInTheDocument();
  });

  it('zooms in, zooms out and resets the view from the control buttons', async () => {
    const user = userEvent.setup();

    renderApp(JSON.stringify({ activeView: AppView.THREE_D }));
    await user.click(await screen.findByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    await user.click(screen.getByRole('button', { name: 'Reset view' }));

    expect(renderer.zoomIn).toHaveBeenCalledOnce();
    expect(renderer.zoomOut).toHaveBeenCalledOnce();
    expect(renderer.resetView).toHaveBeenCalledOnce();
  });

  it('offers no control buttons while there is no model to control', async () => {
    vi.mocked(threeD.loadModel).mockRejectedValue(new Error('network down'));
    renderApp(JSON.stringify({ activeView: AppView.THREE_D }));

    expect(await screen.findByText('Could not load the 3D model.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument();
  });

  function renderApp(initialState?: string) {
    return render(
      <NavigationProvider api={api} initialState={initialState}>
        <Assets />
      </NavigationProvider>,
      { wrapper },
    );
  }
});

function makeModel(): ThreeDModel {
  return {
    modelId: 1,
    revisionId: 1,
    name: 'Platform VPH',
    blobId: 1,
    rotation: null,
    scale: null,
    translation: null,
    scene: {
      unit: 'Meters',
      boundingBox: { min: [0, 0, 0], max: [1, 1, 1] },
      sectors: [{ id: 0, depth: 0, fileName: '0.glb', downloadSize: 1 }],
    },
  };
}
