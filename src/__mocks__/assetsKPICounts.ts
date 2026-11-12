import type { AssetsKPICountService } from '../services/assets/assetsKPICounts';

export function makeAssetsKPICountsContext(): AssetsKPICountService {
  return {
    countAllAssets: vi.fn(() => Promise.resolve(4210)),
    countOperatingAssets: vi.fn(() => Promise.resolve(3800)),
    countAllEquipment: vi.fn(() => Promise.resolve(18500)),
  };
}
