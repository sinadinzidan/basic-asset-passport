import { MAX_QUERY_LIMIT } from '../constants/queries';
import type { LimitedList } from '../types/list';

export function getRequestLimit(limit: number): number {
  return Math.min(limit + 1, MAX_QUERY_LIMIT);
}

export function toLimitedList<Item>(rows: readonly Item[], limit: number): LimitedList<Item> {
  return { items: rows.slice(0, limit), hasMore: rows.length > limit };
}
