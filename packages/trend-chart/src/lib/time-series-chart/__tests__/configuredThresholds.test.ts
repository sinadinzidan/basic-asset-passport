import { describe, expect, it } from 'vitest';

import { CHART_MAX_CONFIGURED_THRESHOLDS } from '../../../constants/timeSeriesChart';
import { ThresholdLevel, ThresholdSide, ThresholdSource } from '../../../enums/timeSeriesChart';
import type { ConfiguredThreshold } from '../../../types/timeSeriesChart';
import { createChartConfiguration } from '../configuration';
import {
  addConfiguredThreshold,
  configuredThresholdId,
  parseThresholdValue,
  removeConfiguredThreshold,
  toChartThreshold,
} from '../configuredThresholds';

const HIGH_ALERT: ConfiguredThreshold = {
  seriesId: 'a',
  level: ThresholdLevel.ALERT,
  side: ThresholdSide.UPPER,
  value: 8.5,
  unit: 'bar',
};

describe(configuredThresholdId.name, () => {
  it('is the same for the same series, level, side and value', () => {
    expect(configuredThresholdId(HIGH_ALERT)).toBe(configuredThresholdId({ ...HIGH_ALERT }));
  });

  it.each([
    [{ seriesId: 'b' }],
    [{ level: ThresholdLevel.DANGER }],
    [{ side: ThresholdSide.LOWER }],
    [{ value: 9 }],
  ])('differs when %j differs', (change) => {
    expect(configuredThresholdId({ ...HIGH_ALERT, ...change })).not.toBe(
      configuredThresholdId(HIGH_ALERT),
    );
  });
});

describe(toChartThreshold.name, () => {
  it('gives the threshold the plot draws, marked as configured', () => {
    expect(toChartThreshold(HIGH_ALERT)).toEqual({
      id: configuredThresholdId(HIGH_ALERT),
      seriesId: 'a',
      level: ThresholdLevel.ALERT,
      side: ThresholdSide.UPPER,
      value: 8.5,
      unit: 'bar',
      source: ThresholdSource.CONFIGURED,
    });
  });
});

describe(parseThresholdValue.name, () => {
  it.each([
    ['8.5', 8.5],
    [' 12 ', 12],
    ['-3', -3],
    ['7,25', 7.25],
    ['0', 0],
  ])('reads %j as %d', (text, value) => {
    expect(parseThresholdValue(text)).toEqual({ value });
  });

  it('asks for a value when the field is empty', () => {
    expect(parseThresholdValue('  ')).toEqual({ error: 'Enter a value for the threshold.' });
  });

  it.each([['high'], ['8 bar'], ['Infinity']])('refuses %j, which is not a number', (text) => {
    expect(parseThresholdValue(text)).toEqual({ error: 'The value must be a number.' });
  });
});

describe(addConfiguredThreshold.name, () => {
  it('adds the threshold after those already there', () => {
    const before = createChartConfiguration(['a'], { thresholds: [HIGH_ALERT] });
    const low = { ...HIGH_ALERT, side: ThresholdSide.LOWER, value: 2 };

    const { configuration, error } = addConfiguredThreshold(before, low);

    expect(error).toBeUndefined();
    expect(configuration.thresholds).toEqual([HIGH_ALERT, low]);
  });

  it('refuses a threshold for a series that is not on the chart', () => {
    const before = createChartConfiguration(['b']);

    const { configuration, error } = addConfiguredThreshold(before, HIGH_ALERT);

    expect(error).toBe('This series is not on the chart.');
    expect(configuration).toBe(before);
  });

  it('refuses the same threshold twice', () => {
    const before = createChartConfiguration(['a'], { thresholds: [HIGH_ALERT] });

    const { configuration, error } = addConfiguredThreshold(before, { ...HIGH_ALERT });

    expect(error).toBe('This threshold is already on the chart.');
    expect(configuration).toBe(before);
  });

  it('refuses one more once the chart holds as many as it takes', () => {
    const full = createChartConfiguration(['a'], {
      thresholds: Array.from({ length: CHART_MAX_CONFIGURED_THRESHOLDS }, (_item, index) => ({
        ...HIGH_ALERT,
        value: index,
      })),
    });

    const { error } = addConfiguredThreshold(full, { ...HIGH_ALERT, value: 99 });

    expect(error).toBe(`You can add up to ${CHART_MAX_CONFIGURED_THRESHOLDS} thresholds.`);
  });
});

describe(removeConfiguredThreshold.name, () => {
  it('takes only that threshold off the chart', () => {
    const low = { ...HIGH_ALERT, side: ThresholdSide.LOWER, value: 2 };
    const before = createChartConfiguration(['a'], { thresholds: [HIGH_ALERT, low] });

    const after = removeConfiguredThreshold(before, configuredThresholdId(HIGH_ALERT));

    expect(after.thresholds).toEqual([low]);
  });

  it('leaves the chart as it is for a threshold it does not have', () => {
    const before = createChartConfiguration(['a'], { thresholds: [HIGH_ALERT] });

    expect(removeConfiguredThreshold(before, 'configured:x').thresholds).toEqual([HIGH_ALERT]);
  });
});
