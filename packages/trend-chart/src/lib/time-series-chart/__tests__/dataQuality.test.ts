import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { CHART_STALE_AFTER_MS } from '../../../constants/timeSeriesChart';
import { DataQualityIssue } from '../../../enums/timeSeriesChart';
import { createPoint, createPoints } from '../../../mocks/chartData';
import { findGaps, profileSeries } from '../dataQuality';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const WHOLE_HOUR = { start: 0, end: 60 * MINUTE_MS };

describe(findGaps.name, () => {
  it('finds an interval of more than five typical steps between two readings', () => {
    const points = pointsAtMinutes([0, 1, 2, 3, 10, 11]);

    expect(findGaps(points)).toEqual([{ from: 3 * MINUTE_MS, to: 10 * MINUTE_MS }]);
  });

  it('does not take an interval of exactly five steps for a gap', () => {
    const points = pointsAtMinutes([0, 1, 2, 3, 8]);

    expect(findGaps(points)).toEqual([]);
  });

  it('does not let a missing reading close a gap', () => {
    const points = [...pointsAtMinutes([0, 1, 2, 3, 10]), createPoint(5 * MINUTE_MS, null)];

    expect(findGaps(points)).toEqual([{ from: 3 * MINUTE_MS, to: 10 * MINUTE_MS }]);
  });

  it('finds nothing when the step between readings is unknown', () => {
    expect(findGaps(createPoints([5]))).toEqual([]);
  });
});

describe(profileSeries.name, () => {
  it('counts the missing, invalid and flagged readings and the repeated time stamps', () => {
    const points = [
      createPoint(0, 1),
      createPoint(MINUTE_MS, null),
      createPoint(2 * MINUTE_MS, Number.NaN),
      createPoint(3 * MINUTE_MS, 50, true),
      createPoint(3 * MINUTE_MS, 6),
      createPoint(4 * MINUTE_MS, 8),
    ];

    const profile = profileSeries('s1', points, WHOLE_HOUR, 4 * MINUTE_MS);

    expect(profile).toMatchObject({
      seriesId: 's1',
      validCount: 3,
      missingCount: 1,
      invalidCount: 1,
      badQualityCount: 1,
      duplicateTimestampCount: 1,
      statistics: { min: 1, max: 8, mean: 5, count: 3 },
    });
  });

  it('warns about each kind of problem with how many there are', () => {
    const points = [
      createPoint(0, 1),
      createPoint(MINUTE_MS, null),
      createPoint(2 * MINUTE_MS, Number.NaN),
      createPoint(3 * MINUTE_MS, 50, true),
      createPoint(3 * MINUTE_MS, 6),
      createPoint(4 * MINUTE_MS, 8),
    ];

    const profile = profileSeries('s1', points, WHOLE_HOUR, 4 * MINUTE_MS);

    expect(profile.warnings).toEqual([
      { issue: DataQualityIssue.MISSING_VALUE, message: 'Missing readings: 1' },
      { issue: DataQualityIssue.INVALID_VALUE, message: 'Invalid readings: 1' },
      { issue: DataQualityIssue.BAD_QUALITY, message: 'Flagged as bad quality: 1' },
      { issue: DataQualityIssue.DUPLICATE_TIMESTAMP, message: 'Duplicate timestamps: 1' },
    ]);
  });

  it('has no warning for a clean, fresh series', () => {
    const points = createPoints([1, 2, 3, 4]);

    const profile = profileSeries('s1', points, WHOLE_HOUR, 3 * MINUTE_MS);

    expect(profile.warnings).toEqual([]);
    expect(profile.isStale).toBe(false);
  });

  it('counts only the readings in the range', () => {
    const points = createPoints([1, null, 3, null, null, 6]);

    const profile = profileSeries('s1', points, { start: 0, end: 2 * MINUTE_MS }, 5 * MINUTE_MS);

    expect(profile.validCount).toBe(2);
    expect(profile.missingCount).toBe(1);
  });

  it('takes the latest valid reading from the whole series, not only from the range', () => {
    const points = createPoints([1, 2, 3, 4, 5, 6]);

    const profile = profileSeries('s1', points, { start: 0, end: 2 * MINUTE_MS }, 5 * MINUTE_MS);

    expect(profile.latestAt).toBe(5 * MINUTE_MS);
  });

  it('reports the gaps in time and warns about them', () => {
    const points = pointsAtMinutes([0, 1, 2, 3, 10, 11]);

    const profile = profileSeries('s1', points, WHOLE_HOUR, 11 * MINUTE_MS);

    expect(profile.gaps).toEqual([{ from: 3 * MINUTE_MS, to: 10 * MINUTE_MS }]);
    expect(profile.warnings).toEqual([
      { issue: DataQualityIssue.TIME_GAP, message: 'Gaps in time: 1' },
    ]);
  });

  it('is stale when the latest valid reading is older than the freshness limit', () => {
    const points = createPoints([1, 2, 3]);

    const profile = profileSeries(
      's1',
      points,
      WHOLE_HOUR,
      2 * MINUTE_MS + CHART_STALE_AFTER_MS + 1,
    );

    expect(profile.isStale).toBe(true);
    expect(profile.warnings).toEqual([
      {
        issue: DataQualityIssue.STALE,
        message: 'The latest valid reading is older than the freshness limit.',
      },
    ]);
  });

  it('is still fresh at exactly the freshness limit', () => {
    const points = createPoints([1, 2, 3]);

    const profile = profileSeries('s1', points, WHOLE_HOUR, 2 * MINUTE_MS + CHART_STALE_AFTER_MS);

    expect(profile.isStale).toBe(false);
  });

  it('uses the freshness limit it is given', () => {
    const points = createPoints([1, 2, 3]);

    const profile = profileSeries('s1', points, WHOLE_HOUR, 4 * MINUTE_MS, MINUTE_MS);

    expect(profile.isStale).toBe(true);
  });

  it('is stale, and says why, when there is no valid reading at all', () => {
    const profile = profileSeries('s1', [], WHOLE_HOUR, 0);

    expect(profile.latestAt).toBeUndefined();
    expect(profile.isStale).toBe(true);
    expect(profile.warnings).toEqual([
      { issue: DataQualityIssue.STALE, message: 'No valid reading at all.' },
    ]);
  });

  it('warns when there are too few valid readings to say much', () => {
    const points = createPoints([1, 2]);

    const profile = profileSeries('s1', points, WHOLE_HOUR, MINUTE_MS);

    expect(profile.warnings).toEqual([
      { issue: DataQualityIssue.MISSING_VALUE, message: 'Only 2 valid readings in this range.' },
    ]);
  });
});

function pointsAtMinutes(minutes: readonly number[]) {
  return minutes.map((minute) => createPoint(minute * MINUTE_MS, 1));
}
