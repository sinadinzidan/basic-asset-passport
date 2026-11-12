import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { ReadingKind } from '../../../enums/timeSeriesChart';
import { createPoint, createPoints } from '../../../mocks/chartData';
import { readingAt } from '../readings';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const SECOND_MS = 1000;
const SERIES_ID = 's1';
const MISSING = { seriesId: SERIES_ID, kind: ReadingKind.MISSING, value: null };

describe(readingAt.name, () => {
  it('is the reading itself when there is one at that instant', () => {
    const points = createPoints([10, 20, 30]);

    expect(readingAt(SERIES_ID, points, MINUTE_MS, { isInterpolated: false })).toEqual({
      seriesId: SERIES_ID,
      kind: ReadingKind.EXACT,
      value: 20,
      readingAt: MINUTE_MS,
    });
  });

  it('is the nearest reading, with its own time stamp, when none is at that instant', () => {
    const points = createPoints([10, 20, 30]);

    expect(
      readingAt(SERIES_ID, points, MINUTE_MS + 10 * SECOND_MS, { isInterpolated: false }),
    ).toEqual({
      seriesId: SERIES_ID,
      kind: ReadingKind.NEAREST,
      value: 20,
      readingAt: MINUTE_MS,
    });
  });

  it('takes the earlier reading when two are equally near', () => {
    const points = createPoints([10, 20]);

    expect(readingAt(SERIES_ID, points, MINUTE_MS / 2, { isInterpolated: false }).value).toBe(10);
  });

  it('still reads the nearest at a step and a half from it', () => {
    const points = createPoints([10, 20, 30]);

    const reading = readingAt(SERIES_ID, points, 2 * MINUTE_MS + 90 * SECOND_MS, {
      isInterpolated: false,
    });

    expect(reading.kind).toBe(ReadingKind.NEAREST);
    expect(reading.value).toBe(30);
  });

  it('is missing beyond a step and a half from the nearest reading, rather than invented', () => {
    const points = createPoints([10, 20, 30]);

    expect(
      readingAt(SERIES_ID, points, 2 * MINUTE_MS + 91 * SECOND_MS, { isInterpolated: false }),
    ).toEqual(MISSING);
  });

  it('is missing beside a lone reading, whose step is unknown', () => {
    const points = createPoints([10]);

    expect(readingAt(SERIES_ID, points, SECOND_MS, { isInterpolated: false })).toEqual(MISSING);
  });

  it('is missing when the series has no valid reading', () => {
    const points = [createPoint(0, null), createPoint(MINUTE_MS, 5, true)];

    expect(readingAt(SERIES_ID, points, MINUTE_MS, { isInterpolated: false })).toEqual(MISSING);
  });

  it('does not take a flagged reading at that instant as the reading', () => {
    const points = [
      createPoint(0, 10),
      createPoint(MINUTE_MS, 999, true),
      createPoint(2 * MINUTE_MS, 30),
    ];

    const reading = readingAt(SERIES_ID, points, MINUTE_MS, { isInterpolated: false });

    expect(reading.kind).toBe(ReadingKind.NEAREST);
    expect(reading.value).toBe(10);
  });

  it('reads the series in time order, whatever order the readings come in', () => {
    const points = [createPoint(2 * MINUTE_MS, 30), createPoint(0, 10), createPoint(MINUTE_MS, 20)];

    expect(
      readingAt(SERIES_ID, points, MINUTE_MS + SECOND_MS, { isInterpolated: false }).value,
    ).toBe(20);
  });

  it('interpolates between the two neighbours when asked, and says so', () => {
    const points = createPoints([10, 20, 30]);

    expect(readingAt(SERIES_ID, points, MINUTE_MS / 2, { isInterpolated: true })).toEqual({
      seriesId: SERIES_ID,
      kind: ReadingKind.INTERPOLATED,
      value: 15,
    });
  });

  it('gives the reading itself even when asked to isInterpolated', () => {
    const points = createPoints([10, 20, 30]);

    expect(readingAt(SERIES_ID, points, MINUTE_MS, { isInterpolated: true }).kind).toBe(
      ReadingKind.EXACT,
    );
  });

  it('does not isInterpolated across more than three steps', () => {
    const points = [0, 1, 2, 10].map((minute) => createPoint(minute * MINUTE_MS, minute));

    expect(readingAt(SERIES_ID, points, 5 * MINUTE_MS, { isInterpolated: true })).toEqual(MISSING);
  });

  it('reads the nearest when asked to isInterpolated past the last reading', () => {
    const points = createPoints([10, 20, 30]);

    const reading = readingAt(SERIES_ID, points, 2 * MINUTE_MS + 10 * SECOND_MS, {
      isInterpolated: true,
    });

    expect(reading).toEqual({
      seriesId: SERIES_ID,
      kind: ReadingKind.NEAREST,
      value: 30,
      readingAt: 2 * MINUTE_MS,
    });
  });
});
