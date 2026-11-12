import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { CHART_STALE_AFTER_MS } from '../../../constants/timeSeriesChart';
import { SeriesDataStatus } from '../../../enums/timeSeriesChart';
import {
  createDefinition,
  createPoint,
  createPoints,
  createSeriesView,
  createThreshold,
} from '../../../mocks/chartData';
import {
  buildMonitoringSnapshots,
  convertPoints,
  convertThresholds,
  deriveSeriesStatus,
} from '../seriesView';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const POINTS = createPoints([1, 2, 3]);
const LATEST_MS = 2 * MINUTE_MS;

describe(deriveSeriesStatus.name, () => {
  it('is an error whenever loading failed, even while loading again', () => {
    const status = deriveSeriesStatus({
      isLoading: true,
      hasError: true,
      points: POINTS,
      nowMs: LATEST_MS,
    });

    expect(status).toBe(SeriesDataStatus.ERROR);
  });

  it('is loading while the readings are on their way', () => {
    const status = deriveSeriesStatus({
      isLoading: true,
      hasError: false,
      points: [],
      nowMs: LATEST_MS,
    });

    expect(status).toBe(SeriesDataStatus.LOADING);
  });

  it('has no data when there is no valid reading', () => {
    const points = [createPoint(0, null), createPoint(MINUTE_MS, 5, true)];

    const status = deriveSeriesStatus({
      isLoading: false,
      hasError: false,
      points,
      nowMs: LATEST_MS,
    });

    expect(status).toBe(SeriesDataStatus.NO_DATA);
  });

  it('is fine when the latest valid reading is within the freshness limit', () => {
    const nowMs = LATEST_MS + CHART_STALE_AFTER_MS;

    const status = deriveSeriesStatus({ isLoading: false, hasError: false, points: POINTS, nowMs });

    expect(status).toBe(SeriesDataStatus.OK);
  });

  it('is stale when the latest valid reading is older than the freshness limit', () => {
    const nowMs = LATEST_MS + CHART_STALE_AFTER_MS + 1;

    const status = deriveSeriesStatus({ isLoading: false, hasError: false, points: POINTS, nowMs });

    expect(status).toBe(SeriesDataStatus.STALE);
  });

  it('uses the freshness limit it is given', () => {
    const status = deriveSeriesStatus({
      isLoading: false,
      hasError: false,
      points: POINTS,
      nowMs: LATEST_MS + 2 * MINUTE_MS,
      staleAfterMs: MINUTE_MS,
    });

    expect(status).toBe(SeriesDataStatus.STALE);
  });
});

describe(convertPoints.name, () => {
  it('converts every value to the other unit', () => {
    const converted = convertPoints(createPoints([0, 100]), '°C', '°F');

    expect(converted.map((point) => point.value)).toEqual([32, 212]);
  });

  it('keeps the time stamp and the quality flag of each reading', () => {
    const converted = convertPoints([createPoint(MINUTE_MS, 100, true)], '°C', '°F');

    expect(converted).toEqual([createPoint(MINUTE_MS, 212, true)]);
  });

  it('leaves a missing reading missing', () => {
    expect(convertPoints(createPoints([null]), '°C', '°F')).toEqual(createPoints([null]));
  });

  it('returns the readings unchanged when no conversion is known, rather than guessing', () => {
    expect(convertPoints(POINTS, '°C', 'bar')).toEqual(POINTS);
  });

  it('returns a copy of the readings when the unit is the same', () => {
    const converted = convertPoints(POINTS, 'bar', 'bar');

    expect(converted).toEqual(POINTS);
    expect(converted).not.toBe(POINTS);
  });
});

describe(convertThresholds.name, () => {
  it('converts the value and names the new unit', () => {
    const threshold = createThreshold({ value: 8, unit: 'bar' });

    const converted = convertThresholds([threshold], 'bar', 'kPa');

    expect(converted).toEqual([{ ...threshold, value: 800, unit: 'kPa' }]);
  });

  it('returns the thresholds unchanged when no conversion is known', () => {
    const threshold = createThreshold({ value: 8, unit: 'bar' });

    expect(convertThresholds([threshold], 'bar', '°C')).toEqual([threshold]);
  });

  it('returns a copy of the thresholds when the unit is the same', () => {
    const thresholds = [createThreshold()];

    const converted = convertThresholds(thresholds, 'bar', 'bar');

    expect(converted).toEqual(thresholds);
    expect(converted).not.toBe(thresholds);
  });
});

describe(buildMonitoringSnapshots.name, () => {
  it('gives the latest valid reading of each series with its age and status', () => {
    const points = [
      ...POINTS,
      createPoint(3 * MINUTE_MS, null),
      createPoint(4 * MINUTE_MS, 99, true),
    ];
    const view = createSeriesView({ points, status: SeriesDataStatus.STALE });

    const snapshots = buildMonitoringSnapshots([view], LATEST_MS + 5 * MINUTE_MS, false);

    expect(snapshots).toEqual([
      {
        seriesId: 's1',
        latestValue: 3,
        latestAt: LATEST_MS,
        ageMs: 5 * MINUTE_MS,
        status: SeriesDataStatus.STALE,
        isSimulated: false,
      },
    ]);
  });

  it('has no value, time or age for a series without a valid reading', () => {
    const view = createSeriesView({ points: [], status: SeriesDataStatus.NO_DATA });

    const [snapshot] = buildMonitoringSnapshots([view], LATEST_MS, false);

    expect(snapshot).toMatchObject({ latestValue: null, latestAt: undefined, ageMs: undefined });
  });

  it('never gives a negative age for a reading ahead of the clock', () => {
    const view = createSeriesView({ points: POINTS });

    const [snapshot] = buildMonitoringSnapshots([view], 0, false);

    expect(snapshot?.ageMs).toBe(0);
  });

  it('marks a series from a simulated source as simulated', () => {
    const view = createSeriesView({
      definition: createDefinition({ isSimulated: true }),
      points: POINTS,
    });

    const [snapshot] = buildMonitoringSnapshots([view], LATEST_MS, false);

    expect(snapshot?.isSimulated).toBe(true);
  });

  it('marks every series as simulated while the live feed is simulated', () => {
    const view = createSeriesView({ points: POINTS });

    const [snapshot] = buildMonitoringSnapshots([view], LATEST_MS, true);

    expect(snapshot?.isSimulated).toBe(true);
  });
});
