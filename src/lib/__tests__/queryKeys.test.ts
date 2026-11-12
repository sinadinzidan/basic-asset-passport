import { describe, expect, it } from 'vitest';

import { isKeyOfList } from '../queryKeys';

describe(isKeyOfList.name, () => {
  const listKey = ['asset-documents', 'project', 'FLOC-1'];

  it('accepts the key of the same list read to another limit', () => {
    expect(isKeyOfList([...listKey, 200], listKey)).toBe(true);
  });

  it('accepts the list key itself', () => {
    expect(isKeyOfList(listKey, listKey)).toBe(true);
  });

  it('rejects the key of another asset', () => {
    expect(isKeyOfList(['asset-documents', 'project', 'FLOC-2', 200], listKey)).toBe(false);
  });

  it('rejects a shorter key', () => {
    expect(isKeyOfList(['asset-documents', 'project'], listKey)).toBe(false);
  });

  it('rejects a missing key', () => {
    expect(isKeyOfList(undefined, listKey)).toBe(false);
  });
});
