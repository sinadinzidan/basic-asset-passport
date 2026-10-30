import type { AssetPassportRecord } from '../types/passport';

const KEY_FACT_LABELS = ['Manufacturer', 'Tag number', 'Serial number', 'Part number'];

export function keyFactsOf(specifications: AssetPassportRecord['specifications']): AssetPassportRecord['specifications'] {
  return KEY_FACT_LABELS.flatMap((label) => specifications.filter((specification) => specification.label === label));
}
