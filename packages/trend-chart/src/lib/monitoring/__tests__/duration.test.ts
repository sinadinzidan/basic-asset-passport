import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_DAY, MILLISECONDS_PER_HOUR } from '../../../constants/formats';
import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { formatDuration } from '../duration';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const HOUR_MS = MILLISECONDS_PER_HOUR;
const DAY_MS = MILLISECONDS_PER_DAY;

describe(formatDuration.name, () => {
  it('reads "---" when there is no duration to give', () => {
    expect(formatDuration(undefined)).toBe('---');
    expect(formatDuration(Number.NaN)).toBe('---');
  });

  it('reads "---" for a negative duration rather than showing one', () => {
    expect(formatDuration(-MINUTE_MS)).toBe('---');
  });

  it('says less than a minute for anything shorter', () => {
    expect(formatDuration(0)).toBe('< 1 min');
    expect(formatDuration(MINUTE_MS - 1)).toBe('< 1 min');
  });

  it('gives whole minutes below an hour', () => {
    expect(formatDuration(MINUTE_MS)).toBe('1 min');
    expect(formatDuration(59 * MINUTE_MS + 59_000)).toBe('59 min');
  });

  it('gives hours and minutes below a day', () => {
    expect(formatDuration(3 * HOUR_MS + 5 * MINUTE_MS)).toBe('3 h 5 min');
  });

  it('leaves out the minutes on the hour', () => {
    expect(formatDuration(3 * HOUR_MS)).toBe('3 h');
  });

  it('gives days and hours from a day up, without the minutes', () => {
    expect(formatDuration(2 * DAY_MS + 3 * HOUR_MS + 40 * MINUTE_MS)).toBe('2 d 3 h');
  });

  it('leaves out the hours on a whole day', () => {
    expect(formatDuration(2 * DAY_MS + 40 * MINUTE_MS)).toBe('2 d');
  });
});
