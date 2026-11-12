import type {
  AssetDetailsTabCounts,
  UseAssetDetailsTabCountsContextType,
} from '../hooks/assets/useAssetDetailsTabCounts';
import type { CountState } from '../types/countState';

const UNKNOWN_COUNT: CountState = { count: null, isLoading: false };

export const NO_TAB_COUNTS: AssetDetailsTabCounts = {
  equipment: UNKNOWN_COUNT,
  timeseries: UNKNOWN_COUNT,
  notes: UNKNOWN_COUNT,
  documents: UNKNOWN_COUNT,
};

export function makeAssetDetailsTabCountsContext(): UseAssetDetailsTabCountsContextType {
  return {
    countAssetEquipment: vi.fn(() => Promise.resolve(1)),
    countAssetNotes: vi.fn(() => Promise.resolve(2)),
    countAssetTimeseries: vi.fn(() => Promise.resolve(3)),
    countAssetDocuments: vi.fn(() => Promise.resolve(1)),
    countAssetLinkedFiles: vi.fn(() => Promise.resolve(3)),
  };
}
