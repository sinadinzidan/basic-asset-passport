import type { RegisterSummaryService } from '../services/assets/registerSummary';

export function makeRegisterSummaryContext(): RegisterSummaryService {
  return {
    countAllAssets: vi.fn(() => Promise.resolve(4210)),
    countOperatingAssets: vi.fn(() => Promise.resolve(3800)),
    countAllEquipment: vi.fn(() => Promise.resolve(18500)),
  };
}
