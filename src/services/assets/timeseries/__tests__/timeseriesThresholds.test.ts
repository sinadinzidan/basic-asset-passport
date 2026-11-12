import { ThresholdLevel, ThresholdSide } from '@flows/trend-chart';
import { describe, expect, it } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { getTimeseriesThresholds } from '../timeseriesThresholds';

function makeSeries(limits: Record<string, string>) {
  return makeInstanceDetails({
    space: 'ts',
    externalId: 'PI.1',
    properties: [
      { identifier: 'engunits', label: 'Engineering Units', value: 'bar' },
      ...Object.entries(limits).map(([identifier, value]) => ({
        identifier,
        label: identifier,
        value,
      })),
    ],
  });
}

describe(getTimeseriesThresholds.name, () => {
  it('has none when the series holds no limits', () => {
    expect(getTimeseriesThresholds(makeSeries({}))).toEqual([]);
  });

  it('draws a trip limit as a danger line and the other limits as alerts', () => {
    const thresholds = getTimeseriesThresholds(
      makeSeries({ tripLimitMax: '12.5', oweLimitMin: '2', dleLimitMax: '9' }),
    );

    expect(thresholds).toHaveLength(3);
    expect(thresholds).toContainEqual(
      expect.objectContaining({
        seriesId: 'ts:PI.1',
        level: ThresholdLevel.DANGER,
        side: ThresholdSide.UPPER,
        value: 12.5,
        unit: 'bar',
        label: 'Trip high',
      }),
    );
    expect(thresholds).toContainEqual(
      expect.objectContaining({
        level: ThresholdLevel.ALERT,
        side: ThresholdSide.LOWER,
        value: 2,
        label: 'OWE low',
      }),
    );
    expect(thresholds).toContainEqual(
      expect.objectContaining({
        level: ThresholdLevel.ALERT,
        side: ThresholdSide.UPPER,
        value: 9,
        label: 'DLE high',
      }),
    );
  });

  it('gives each line its own ID', () => {
    const thresholds = getTimeseriesThresholds(
      makeSeries({ tripLimitMax: '1', tripLimitMin: '0' }),
    );

    expect(new Set(thresholds.map(({ id }) => id)).size).toBe(2);
  });

  it('keeps a limit of zero', () => {
    const [threshold] = getTimeseriesThresholds(makeSeries({ tripLimitMin: '0' }));

    expect(threshold?.value).toBe(0);
  });

  it('skips a limit that is not a number', () => {
    expect(getTimeseriesThresholds(makeSeries({ tripLimitMax: 'n/a', oweLimitMax: '' }))).toEqual(
      [],
    );
  });
});
