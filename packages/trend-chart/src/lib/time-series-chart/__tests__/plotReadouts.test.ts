import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { ReadingKind } from '../../../enums/timeSeriesChart';
import { createDefinition, createPoints, createSeriesView } from '../../../mocks/chartData';
import type { ChartSeriesView } from '../../../types/timeSeriesChart';
import { setChartTimeZone } from '../../timeZone';
import {
  describeHover,
  describeMarkerReading,
  NO_DATA_TEXT,
  readHover,
  readMarker,
} from '../plotReadouts';
import { buildPlotSeries } from '../plotSeries';
import type { PlotSeries } from '../plotSeries';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const TEN_MINUTES = { start: 0, end: 10 * MINUTE_MS };

// The host app may have set its own zone; these tests start from the chart's default.
beforeEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));
afterEach(() => setChartTimeZone({ id: 'UTC', label: 'UTC' }));

describe(readHover.name, () => {
  it('reads the bucket of every series nearest to the instant', () => {
    const first = plotSeries();
    const second = plotSeries({
      definition: createDefinition({ id: 's2' }),
      points: createPoints([7, 8, 9]),
    });

    const readings = readHover([first, second], 1.2 * MINUTE_MS);

    expect(readings.map((reading) => [reading.entry.id, reading.bucket?.average])).toEqual([
      ['s1', 5],
      ['s2', 8],
    ]);
  });

  it('has no bucket for a series without a reading near the instant', () => {
    const [reading] = readHover([plotSeries()], 8 * MINUTE_MS);

    expect(reading?.bucket).toBeUndefined();
  });
});

describe(describeHover.name, () => {
  it('gives the value with its unit under the name and the colour of the series', () => {
    const [reading] = readHover([plotSeries()], MINUTE_MS);

    expect(reading && describeHover(reading)).toEqual({
      seriesId: 's1',
      label: 'Discharge pressure',
      color: 'var(--chart-1)',
      value: '5.00 bar',
      isMissing: false,
    });
  });

  it('says there is no data, never zero, where the series has no reading', () => {
    const row = describeHover({ entry: plotSeries(), bucket: undefined });

    expect(row).toMatchObject({ value: NO_DATA_TEXT, isMissing: true });
  });

  it('says there is no data for a bucket without a value', () => {
    const [reading] = readHover([plotSeries({ points: createPoints([1, null, 3]) })], MINUTE_MS);

    expect(reading && describeHover(reading)).toMatchObject({ value: 'No data', isMissing: true });
  });
});

describe(readMarker.name, () => {
  it('reads the reading exactly at the marker', () => {
    const [marker] = readMarker([plotSeries()], MINUTE_MS, false);

    expect(marker?.reading).toMatchObject({ seriesId: 's1', kind: ReadingKind.EXACT, value: 5 });
  });

  it('takes the nearest reading between two readings', () => {
    const [marker] = readMarker([plotSeries()], 1.25 * MINUTE_MS, false);

    expect(marker?.reading).toMatchObject({
      kind: ReadingKind.NEAREST,
      value: 5,
      readingAt: MINUTE_MS,
    });
  });

  it('interpolates between two readings when asked to', () => {
    const [marker] = readMarker([plotSeries()], 1.5 * MINUTE_MS, true);

    expect(marker?.reading).toMatchObject({ kind: ReadingKind.INTERPOLATED, value: 4 });
  });

  it('reads every series', () => {
    const second = plotSeries({
      definition: createDefinition({ id: 's2' }),
      points: createPoints([7, 8, 9]),
    });

    const markers = readMarker([plotSeries(), second], MINUTE_MS, false);

    expect(markers.map((marker) => marker.reading.value)).toEqual([5, 8]);
  });
});

describe(describeMarkerReading.name, () => {
  it('describes an exact reading by its value', () => {
    const row = describeMarkerReading({
      entry: plotSeries(),
      reading: { seriesId: 's1', kind: ReadingKind.EXACT, value: 5, readingAt: MINUTE_MS },
    });

    expect(row).toEqual({
      seriesId: 's1',
      label: 'Discharge pressure',
      color: 'var(--chart-1)',
      value: '5.00 bar',
      detail: 'Reading',
      kind: ReadingKind.EXACT,
      isMissing: false,
    });
  });

  it('says when the nearest reading was taken', () => {
    const row = describeMarkerReading({
      entry: plotSeries(),
      reading: {
        seriesId: 's1',
        kind: ReadingKind.NEAREST,
        value: 5,
        readingAt: Date.UTC(2026, 9, 1, 8, 5, 42),
      },
    });

    expect(row.detail).toBe('Nearest reading at 01-Oct-2026 08:05:42 UTC');
  });

  it('says that a value is interpolated', () => {
    const row = describeMarkerReading({
      entry: plotSeries(),
      reading: { seriesId: 's1', kind: ReadingKind.INTERPOLATED, value: 4 },
    });

    expect(row).toMatchObject({
      value: '4.00 bar',
      detail: 'Interpolated',
      kind: ReadingKind.INTERPOLATED,
    });
  });

  it('says there is no reading, with no detail, where the series has none', () => {
    const row = describeMarkerReading({
      entry: plotSeries(),
      reading: { seriesId: 's1', kind: ReadingKind.MISSING, value: null },
    });

    expect(row).toMatchObject({
      value: 'No reading',
      detail: undefined,
      kind: ReadingKind.MISSING,
      isMissing: true,
    });
  });

  it('takes a reading without a value for missing, whatever its kind', () => {
    const row = describeMarkerReading({
      entry: plotSeries(),
      reading: { seriesId: 's1', kind: ReadingKind.EXACT, value: null },
    });

    expect(row).toMatchObject({ value: 'No reading', isMissing: true });
  });
});

/** A drawn series with the readings 1, 5 and 3, a minute apart. */
function plotSeries(overrides: Partial<ChartSeriesView> = {}): PlotSeries {
  const view = createSeriesView({ points: createPoints([1, 5, 3]), ...overrides });
  return buildPlotSeries(view, TEN_MINUTES, {
    shouldShowMinMax: false,
    shouldShowThresholds: false,
  });
}
