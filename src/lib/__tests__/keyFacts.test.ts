import { describe, expect, it } from 'vitest';

import { keyFactsOf } from '../keyFacts';

describe('keyFactsOf', () => {
  it('returns the identifying specifications in a fixed order and ignores the rest', () => {
    expect(keyFactsOf([
      { label: 'Serial number', value: 'S-1' }, { label: 'Class', value: 'Motor' }, { label: 'Manufacturer', value: 'ABB' },
    ])).toEqual([{ label: 'Manufacturer', value: 'ABB' }, { label: 'Serial number', value: 'S-1' }]);
  });
  it('returns nothing when none of them are present', () => {
    expect(keyFactsOf([{ label: 'Source id', value: 'WMT:1' }])).toEqual([]);
  });
});
