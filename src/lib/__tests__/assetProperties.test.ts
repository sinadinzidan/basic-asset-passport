import { describe, expect, it } from 'vitest';

import { makeInstanceDetails } from '../../__mocks__/assets';
import { getPropertyValue } from '../assetProperties';

describe(getPropertyValue.name, () => {
  it('returns the value of the matching property', () => {
    const instance = makeInstanceDetails();

    expect(getPropertyValue(instance, 'plantId')).toBe('G307');
  });

  it('returns undefined when the property is missing', () => {
    const instance = makeInstanceDetails();

    expect(getPropertyValue(instance, 'unknown')).toBeUndefined();
  });

  it('returns undefined when there is no instance', () => {
    expect(getPropertyValue(undefined, 'name')).toBeUndefined();
  });
});
