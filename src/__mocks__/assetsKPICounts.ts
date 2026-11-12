import type { UseAssetsKPICountsContextType } from '../hooks/assets/useAssetsKPICounts';

export function makeAssetsKPICountsContext(): UseAssetsKPICountsContextType {
  return {
    countAllAssets: vi.fn(() => Promise.resolve(4210)),
    countOperatingAssets: vi.fn(() => Promise.resolve(3800)),
    countAllEquipment: vi.fn(() => Promise.resolve(18500)),
  };
}
