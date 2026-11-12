import { describe, expect, it } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { ThresholdLevel, ThresholdSide, ThresholdSource } from '../../../enums/timeSeriesChart';
import { createPoint, createPoints, createThreshold } from '../../../mocks/chartData';
import { countBeyond, findBreaches, isBeyondThreshold, thresholdsFromLimits } from '../thresholds';

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const UPPER_AT_8 = createThreshold({ side: ThresholdSide.UPPER, value: 8 });
const LOWER_AT_2 = createThreshold({ side: ThresholdSide.LOWER, value: 2 });

describe(thresholdsFromLimits.name, () => {
  it('makes a threshold of each limit: the upper ones first, alert before danger', () => {
    const thresholds = thresholdsFromLimits(
      { seriesId: 's1', unit: 'bar', alertLow: 2, alertHigh: 8, dangerLow: 1, dangerHigh: 10 },
      ThresholdSource.DATA_SOURCE,
    );

    expect(thresholds.map((threshold) => [threshold.id, threshold.value])).toEqual([
      ['s1:ALERT:UPPER', 8],
      ['s1:DANGER:UPPER', 10],
      ['s1:ALERT:LOWER', 2],
      ['s1:DANGER:LOWER', 1],
    ]);
  });

  it('carries the series, the unit and where the limit came from', () => {
    const thresholds = thresholdsFromLimits(
      { seriesId: 's1', unit: 'bar', dangerLow: 1 },
      ThresholdSource.CONFIGURED,
    );

    expect(thresholds).toEqual([
      {
        id: 's1:DANGER:LOWER',
        seriesId: 's1',
        level: ThresholdLevel.DANGER,
        side: ThresholdSide.LOWER,
        value: 1,
        unit: 'bar',
        source: ThresholdSource.CONFIGURED,
      },
    ]);
  });

  it('makes no threshold of a limit that is not given', () => {
    expect(
      thresholdsFromLimits({ seriesId: 's1', unit: 'bar' }, ThresholdSource.DATA_SOURCE),
    ).toEqual([]);
  });

  it('keeps a limit of zero', () => {
    const thresholds = thresholdsFromLimits(
      { seriesId: 's1', unit: 'bar', alertLow: 0 },
      ThresholdSource.DATA_SOURCE,
    );

    expect(thresholds.map((threshold) => threshold.value)).toEqual([0]);
  });
});

describe(isBeyondThreshold.name, () => {
  it('is beyond an upper threshold only above it', () => {
    expect(isBeyondThreshold(8.1, UPPER_AT_8)).toBe(true);
    expect(isBeyondThreshold(8, UPPER_AT_8)).toBe(false);
  });

  it('is beyond a lower threshold only below it', () => {
    expect(isBeyondThreshold(1.9, LOWER_AT_2)).toBe(true);
    expect(isBeyondThreshold(2, LOWER_AT_2)).toBe(false);
  });
});

describe(findBreaches.name, () => {
  it('joins consecutive readings beyond a threshold into one breach with its highest value', () => {
    const points = createPoints([5, 9, 11, 9, 5]);

    expect(findBreaches(points, [UPPER_AT_8])).toEqual([
      { threshold: UPPER_AT_8, from: MINUTE_MS, to: 3 * MINUTE_MS, peak: 11 },
    ]);
  });

  it('starts a new breach after a reading back within the threshold', () => {
    const points = createPoints([9, 5, 10]);

    expect(findBreaches(points, [UPPER_AT_8])).toEqual([
      { threshold: UPPER_AT_8, from: 0, to: 0, peak: 9 },
      { threshold: UPPER_AT_8, from: 2 * MINUTE_MS, to: 2 * MINUTE_MS, peak: 10 },
    ]);
  });

  it('gives the lowest value as the peak of a breach of a lower threshold', () => {
    const points = createPoints([3, 1, 0.5, 1.5, 3]);

    expect(findBreaches(points, [LOWER_AT_2])).toEqual([
      { threshold: LOWER_AT_2, from: MINUTE_MS, to: 3 * MINUTE_MS, peak: 0.5 },
    ]);
  });

  it('keeps a breach that is still going on at the last reading', () => {
    const points = createPoints([5, 9, 10]);

    expect(findBreaches(points, [UPPER_AT_8])).toEqual([
      { threshold: UPPER_AT_8, from: MINUTE_MS, to: 2 * MINUTE_MS, peak: 10 },
    ]);
  });

  it('lists the breaches of every threshold in time order', () => {
    const points = createPoints([1, 5, 9]);

    const breaches = findBreaches(points, [UPPER_AT_8, LOWER_AT_2]);

    expect(breaches.map((breach) => breach.threshold.side)).toEqual([
      ThresholdSide.LOWER,
      ThresholdSide.UPPER,
    ]);
  });

  it('looks only at the readings in the range', () => {
    const points = createPoints([9, 5, 9, 5]);

    const breaches = findBreaches(points, [UPPER_AT_8], { start: MINUTE_MS, end: 3 * MINUTE_MS });

    expect(breaches.map((breach) => breach.from)).toEqual([2 * MINUTE_MS]);
  });

  it('leaves out readings that are missing or flagged, without ending the breach', () => {
    const points = [
      createPoint(0, 9),
      createPoint(MINUTE_MS, null),
      createPoint(2 * MINUTE_MS, 1, true),
      createPoint(3 * MINUTE_MS, 10),
    ];

    expect(findBreaches(points, [UPPER_AT_8])).toEqual([
      { threshold: UPPER_AT_8, from: 0, to: 3 * MINUTE_MS, peak: 10 },
    ]);
  });

  it('finds nothing when no reading is beyond a threshold', () => {
    expect(findBreaches(createPoints([3, 4, 5]), [UPPER_AT_8, LOWER_AT_2])).toEqual([]);
  });
});

describe(countBeyond.name, () => {
  it('counts the valid readings beyond the threshold', () => {
    const points = [...createPoints([9, 5, 10, null]), createPoint(4 * MINUTE_MS, 50, true)];

    expect(countBeyond(points, UPPER_AT_8)).toBe(2);
  });

  it('counts only the readings in the range', () => {
    const points = createPoints([9, 5, 10]);

    expect(countBeyond(points, UPPER_AT_8, { start: MINUTE_MS, end: 2 * MINUTE_MS })).toBe(1);
  });
});
