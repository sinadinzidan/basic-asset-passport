import type { CountState } from '../types/countState';

const COUNT_LOCALE = 'en-US';

type CountQuery = {
  data: number | undefined;
  isPending: boolean;
};

export function formatCount(count: number): string {
  return count.toLocaleString(COUNT_LOCALE);
}

export function toCountState({ data, isPending }: CountQuery): CountState {
  return { count: data ?? null, isLoading: isPending };
}

export function formatTabCountBadge({ count }: CountState): string | undefined {
  return count === null ? undefined : formatCount(count);
}
