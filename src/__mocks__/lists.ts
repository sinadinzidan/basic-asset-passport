import type { LimitedList } from '../types/list';

export function makeLimitedList<Item>(
  items: Item[] = [],
  hasMore: boolean = false,
): LimitedList<Item> {
  return { items, hasMore };
}
