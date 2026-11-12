import { describe, expect, it } from 'vitest';

import { getInstanceKey, isSameInstance } from '../instanceKey';

const pump = { space: 'asset-space', externalId: 'PUMP-1' };

describe(getInstanceKey.name, () => {
  it('joins the space and the external ID', () => {
    expect(getInstanceKey(pump)).toBe('asset-space:PUMP-1');
  });

  it('ignores the other fields of an instance', () => {
    const note = { ...pump, title: 'Pump' };

    expect(getInstanceKey(note)).toBe('asset-space:PUMP-1');
  });
});

describe(isSameInstance.name, () => {
  it('matches an instance with the same space and external ID', () => {
    expect(isSameInstance(pump, { ...pump })).toBe(true);
  });

  it('does not match another external ID', () => {
    expect(isSameInstance(pump, { ...pump, externalId: 'PUMP-2' })).toBe(false);
  });

  it('does not match the same external ID in another space', () => {
    expect(isSameInstance(pump, { ...pump, space: 'other-space' })).toBe(false);
  });

  it('does not match when there is nothing to compare with', () => {
    expect(isSameInstance(pump, undefined)).toBe(false);
  });
});
