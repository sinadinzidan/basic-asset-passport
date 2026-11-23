import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { NO_TAB_COUNTS } from '../../../__mocks__/assetDetailsTabCounts';
import { makeInstanceDetails } from '../../../__mocks__/assets';
import { makeNavigationStore } from '../../../__mocks__/navigation';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { MODEL } from '../../../config/model';
import { AssetTab } from '../../../enums/assetTab';
import { NavigationStoreContext } from '../../../hooks/general/useNavigationState';
import { ThreeDClientContext } from '../../../hooks/three-d/useThreeDClient';
import {
  UseAssetThreeDViewModelContext,
  type UseAssetThreeDViewModelContextType,
} from '../../../hooks/three-d/view-models/useAssetThreeDViewModel';
import type { ThreeDModel } from '../../../types/threeD';
import type { ThreeDContextType } from '../../../types/threeDContext';
import { AssetDetailsTabs } from '../AssetDetailsTabs';

const ruwaisAsset = makeAsset('Ruwais');
const otherAsset = makeAsset('North Plant');

describe(`${AssetDetailsTabs.name} 3D`, () => {
  let threeD: ThreeDContextType;
  let deps: UseAssetThreeDViewModelContextType;
  let store: StoreApi<ReturnType<typeof makeNavigationStore> extends StoreApi<infer S> ? S : never>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    store = makeNavigationStore({
      selectedAsset: { space: ruwaisAsset.space, externalId: ruwaisAsset.externalId },
    });
    threeD = {
      project: 'p',
      findModel: vi.fn(() => Promise.resolve(makeModel())),
      loadSector: vi.fn(() => Promise.resolve(new ArrayBuffer(1))),
    };
    deps = {
      createRenderer: vi.fn(() => ({ addSector: vi.fn(), dispose: vi.fn() })),
      loadSectors: vi.fn((props) => {
        props.onProgress({
          loadedSectors: 1,
          failedSectors: 0,
          skippedSectors: 0,
          totalSectors: 1,
          triangleCount: 4,
          unsupported: { Foo: 3 },
        });

        return Promise.resolve({
          loadedSectors: 1,
          failedSectors: 0,
          skippedSectors: 0,
          totalSectors: 1,
          triangleCount: 4,
          unsupported: { Foo: 3 },
        });
      }),
    };
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <NavigationStoreContext.Provider value={store}>
        <ThreeDClientContext.Provider value={threeD}>
          <UseAssetThreeDViewModelContext.Provider value={deps}>
            <QueryWrapper>{children}</QueryWrapper>
          </UseAssetThreeDViewModelContext.Provider>
        </ThreeDClientContext.Provider>
      </NavigationStoreContext.Provider>
    );
  });

  it('offers a 3D tab for an asset of the Ruwais plant', () => {
    render(<AssetDetailsTabs asset={ruwaisAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(screen.getByRole('tab', { name: '3D' })).toBeInTheDocument();
  });

  it('offers no 3D tab for an asset of another plant', () => {
    render(<AssetDetailsTabs asset={otherAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(screen.queryByRole('tab', { name: '3D' })).not.toBeInTheDocument();
  });

  it('shows the properties instead when the 3D tab was asked for on another plant', () => {
    store = makeNavigationStore({ activeAssetTab: AssetTab.THREE_D });
    render(<AssetDetailsTabs asset={otherAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(screen.getByRole('tab', { name: 'Properties' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('shows the model and how much of it is drawn when the tab is chosen', async () => {
    const user = userEvent.setup();

    render(<AssetDetailsTabs asset={ruwaisAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });
    await user.click(screen.getByRole('tab', { name: '3D' }));

    expect(await screen.findByText(/Valhall · 1 of 1 parts · loaded/)).toBeInTheDocument();
    expect(screen.getByText(/Unsupported shapes skipped: Foo: 3/)).toBeInTheDocument();
    expect(threeD.findModel).toHaveBeenCalledWith('Valhall');
    expect(deps.createRenderer).toHaveBeenCalledOnce();
  });

  it('says so when the project has no such model', async () => {
    store = makeNavigationStore({ activeAssetTab: AssetTab.THREE_D });
    vi.mocked(threeD.findModel).mockResolvedValue(null);
    render(<AssetDetailsTabs asset={ruwaisAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByText('No 3D model')).toBeInTheDocument();
    expect(deps.createRenderer).not.toHaveBeenCalled();
  });

  it('shows the reason and lets the user retry when the model cannot be fetched', async () => {
    const user = userEvent.setup();

    store = makeNavigationStore({ activeAssetTab: AssetTab.THREE_D });
    vi.mocked(threeD.findModel).mockRejectedValueOnce(new Error('network down'));
    render(<AssetDetailsTabs asset={ruwaisAsset} tabCounts={NO_TAB_COUNTS} />, { wrapper });

    expect(await screen.findByText('Could not load the 3D model.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText(/Valhall · /)).toBeInTheDocument();
  });
});

function makeAsset(plantName: string) {
  return makeInstanceDetails({
    properties: [
      { identifier: MODEL.properties.asset.plantName, label: 'Plant', value: plantName },
    ],
  });
}

function makeModel(): ThreeDModel {
  return {
    modelId: 1,
    revisionId: 1,
    name: 'Valhall',
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
