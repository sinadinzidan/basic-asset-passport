import { describe, expect, it } from 'vitest';

import { activeRangePresetId } from '../rangePresets';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const NOW = Date.UTC(2026, 10, 9, 12, 0);

describe(activeRangePresetId.name, () => {
  it('finds the preset a window that ends now spans', () => {
    expect(activeRangePresetId({ start: NOW - 180 * DAY_MS, end: NOW }, NOW)).toBe('last-6-months');
  });

  it('finds a preset that carries a relative range too', () => {
    expect(activeRangePresetId({ start: NOW - 7 * DAY_MS, end: NOW }, NOW)).toBe('last-7-days');
  });

  it('tolerates the minute the picker works to', () => {
    const end = NOW - MINUTE_MS;
    const window = { start: end - 180 * DAY_MS, end };

    expect(activeRangePresetId(window, NOW)).toBe('last-6-months');
  });

  it('finds no preset when the window does not end now', () => {
    expect(
      activeRangePresetId({ start: NOW - 190 * DAY_MS, end: NOW - 10 * DAY_MS }, NOW),
    ).toBeUndefined();
  });

  it('finds no preset when the span matches none', () => {
    expect(activeRangePresetId({ start: NOW - 5 * DAY_MS, end: NOW }, NOW)).toBeUndefined();
  });
});
