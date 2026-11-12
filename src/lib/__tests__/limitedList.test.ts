import { describe, expect, it } from 'vitest';

import { MAX_QUERY_LIMIT } from '../../constants/queries';
import { getRequestLimit, toLimitedList } from '../limitedList';

describe(getRequestLimit.name, () => {
  it('asks for one row more than is shown', () => {
    expect(getRequestLimit(50)).toBe(51);
  });

  it('never asks for more than the API returns', () => {
    expect(getRequestLimit(MAX_QUERY_LIMIT)).toBe(MAX_QUERY_LIMIT);
  });
});

describe(toLimitedList.name, () => {
  it('keeps every row of a list within the limit', () => {
    expect(toLimitedList(['a', 'b'], 2)).toEqual({
      items: ['a', 'b'],
      hasMore: false,
    });
  });

  it('drops the extra row and reports that the list goes on', () => {
    expect(toLimitedList(['a', 'b', 'c'], 2)).toEqual({
      items: ['a', 'b'],
      hasMore: true,
    });
  });
});
