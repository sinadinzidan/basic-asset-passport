import { EMPTY_VALUE_LABEL } from '../constants/labels';

/** True when a file's id or description only says its name again (common in CDF, where the name is often the id). */
export function repeatsName(value: string | undefined, name: string): boolean {
  return value !== undefined && value.trim().toLowerCase() === name.trim().toLowerCase();
}

/**
 * The one-line description under a file name: id, revision, date and, when known, where the file is linked from.
 * The id is left out when it is the same as the name, which the row already shows.
 */
export function formatFileMeta({ name, id, revision, date, origin }: { name: string; id: string; revision?: string; date?: string; origin?: string }): string {
  return [repeatsName(id, name) ? undefined : id, `Rev ${revision ?? EMPTY_VALUE_LABEL}`, date ?? EMPTY_VALUE_LABEL, origin].filter(Boolean).join(' · ');
}
