import { describe, expect, it } from 'vitest';

import { PASSPORT_TAB_STORED_VALUES } from '../../constants/persistence';
import { PassportTab } from '../../enums/passportTab';
import { fromStoredValue, isEnumValue } from '../enumGuards';

describe('isEnumValue', () => {
  it('accepts member values and rejects everything else', () => {
    expect(isEnumValue(PassportTab, 'OVERVIEW')).toBe(true);
    expect(isEnumValue(PassportTab, 'overview')).toBe(false);
    expect(isEnumValue(PassportTab, undefined)).toBe(false);
    expect(isEnumValue(PassportTab, 3)).toBe(false);
  });
});

describe('fromStoredValue', () => {
  it('maps a stored value back to its member', () => {
    expect(fromStoredValue(PassportTab, PASSPORT_TAB_STORED_VALUES, 'documents')).toBe(PassportTab.DOCUMENTS);
  });
  it('returns undefined for a value that is not stored', () => {
    expect(fromStoredValue(PassportTab, PASSPORT_TAB_STORED_VALUES, 'DOCUMENTS')).toBeUndefined();
    expect(fromStoredValue(PassportTab, PASSPORT_TAB_STORED_VALUES, null)).toBeUndefined();
  });
});
