import type { AssetSummaryService } from '../services/assets/assetSummary';

export function makeAssetSummaryContext(): AssetSummaryService {
  return {
    countAllAssets: vi.fn(() => Promise.resolve(4210)),
    countOperatingAssets: vi.fn(() => Promise.resolve(3800)),
    countAllEquipment: vi.fn(() => Promise.resolve(18500)),
  };
}
