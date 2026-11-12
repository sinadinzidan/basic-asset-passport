import { describe, expect, it } from 'vitest';

import { AxisScaleMode } from '../../../enums/timeSeriesChart';
import type { AxisSetting } from '../../../types/timeSeriesChart';
import { applyAxisSetting, axisSettingFor, validateAxisLimits, withAxisSetting } from '../axes';

const AUTOMATIC: AxisSetting = { seriesId: 's1', mode: AxisScaleMode.AUTO };
const MANUAL: AxisSetting = { seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 0, max: 10 };
const AUTOMATIC_DOMAIN = { minimum: 2, maximum: 8 };

describe(validateAxisLimits.name, () => {
  it('makes a manual axis of two numbers', () => {
    expect(validateAxisLimits('s1', '0', '10', AUTOMATIC)).toEqual({ setting: MANUAL });
  });

  it('reads past spaces and takes a comma for the decimal point', () => {
    const { setting } = validateAxisLimits('s1', ' 1,5 ', '2.5', AUTOMATIC);

    expect(setting).toEqual({ seriesId: 's1', mode: AxisScaleMode.MANUAL, min: 1.5, max: 2.5 });
  });

  it('makes a manual axis of one limit, leaving the other open', () => {
    const { setting, error } = validateAxisLimits('s1', '', '10', AUTOMATIC);

    expect(error).toBeUndefined();
    expect(setting).toEqual({
      seriesId: 's1',
      mode: AxisScaleMode.MANUAL,
      min: undefined,
      max: 10,
    });
  });

  it('goes back to an automatic axis when both limits are empty', () => {
    expect(validateAxisLimits('s1', ' ', '', MANUAL)).toEqual({ setting: AUTOMATIC });
  });

  it('refuses a minimum that is not a number and keeps the axis as it was', () => {
    expect(validateAxisLimits('s1', 'low', '10', MANUAL)).toEqual({
      setting: MANUAL,
      error: 'The minimum must be a number.',
    });
  });

  it('refuses a maximum that is not a number and keeps the axis as it was', () => {
    expect(validateAxisLimits('s1', '0', 'high', MANUAL)).toEqual({
      setting: MANUAL,
      error: 'The maximum must be a number.',
    });
  });

  it('refuses a minimum above the maximum', () => {
    expect(validateAxisLimits('s1', '10', '5', MANUAL)).toEqual({
      setting: MANUAL,
      error: 'The minimum must be lower than the maximum.',
    });
  });

  it('refuses a minimum equal to the maximum', () => {
    expect(validateAxisLimits('s1', '5', '5', MANUAL).error).toBe(
      'The minimum must be lower than the maximum.',
    );
  });
});

describe(axisSettingFor.name, () => {
  it('finds the setting of the series', () => {
    const other: AxisSetting = { seriesId: 's2', mode: AxisScaleMode.MANUAL, min: 1, max: 2 };

    expect(axisSettingFor([other, MANUAL], 's1')).toBe(MANUAL);
  });

  it('is an automatic axis for a series without a setting', () => {
    expect(axisSettingFor([], 's1')).toEqual(AUTOMATIC);
  });
});

describe(applyAxisSetting.name, () => {
  it('keeps the automatic domain on an automatic axis', () => {
    expect(applyAxisSetting(AUTOMATIC_DOMAIN, AUTOMATIC)).toBe(AUTOMATIC_DOMAIN);
  });

  it('uses the manual limits on a manual axis', () => {
    expect(applyAxisSetting(AUTOMATIC_DOMAIN, MANUAL)).toEqual({ minimum: 0, maximum: 10 });
  });

  it('fills an open manual limit from the automatic domain', () => {
    const onlyMaximum: AxisSetting = { seriesId: 's1', mode: AxisScaleMode.MANUAL, max: 20 };

    expect(applyAxisSetting(AUTOMATIC_DOMAIN, onlyMaximum)).toEqual({ minimum: 2, maximum: 20 });
  });

  it('falls back to the automatic domain when the limits would leave nothing to draw', () => {
    const belowTheData: AxisSetting = { seriesId: 's1', mode: AxisScaleMode.MANUAL, max: 1 };

    expect(applyAxisSetting(AUTOMATIC_DOMAIN, belowTheData)).toBe(AUTOMATIC_DOMAIN);
  });
});

describe(withAxisSetting.name, () => {
  it('adds the setting of a series that had none', () => {
    expect(withAxisSetting([], MANUAL)).toEqual([MANUAL]);
  });

  it('replaces the setting the series already had', () => {
    const wider: AxisSetting = { seriesId: 's1', mode: AxisScaleMode.MANUAL, min: -5, max: 50 };

    expect(withAxisSetting([MANUAL], wider)).toEqual([wider]);
  });

  it('removes the setting when the axis goes back to automatic', () => {
    expect(withAxisSetting([MANUAL], AUTOMATIC)).toEqual([]);
  });

  it('leaves the settings of other series alone', () => {
    const other: AxisSetting = { seriesId: 's2', mode: AxisScaleMode.MANUAL, min: 1, max: 2 };

    expect(withAxisSetting([other, MANUAL], AUTOMATIC)).toEqual([other]);
  });
});
