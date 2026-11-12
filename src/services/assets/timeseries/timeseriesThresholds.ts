import {
  ThresholdLevel,
  ThresholdSide,
  ThresholdSource,
  type ChartThreshold,
} from '@flows/trend-chart';

import { getPropertyValue } from '../../../lib/assetProperties';
import { getTimeseriesKey, getTimeseriesUnit } from '../../../lib/timeseriesProperties';
import type { AssetInstanceDetails } from '../../../types/asset';

type LimitProperty = {
  identifier: string;

  label: string;
  level: ThresholdLevel;
  side: ThresholdSide;
};

const LIMIT_PROPERTIES: readonly LimitProperty[] = [
  {
    identifier: 'oweLimitMax',
    label: 'OWE high',
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: 'oweLimitMin',
    label: 'OWE low',
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.LOWER,
  },
  {
    identifier: 'dleLimitMax',
    label: 'DLE high',
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: 'dleLimitMin',
    label: 'DLE low',
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.LOWER,
  },
  {
    identifier: 'tripLimitMax',
    label: 'Trip high',
    level: ThresholdLevel.DANGER,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: 'tripLimitMin',
    label: 'Trip low',
    level: ThresholdLevel.DANGER,
    side: ThresholdSide.LOWER,
  },
];

export function getTimeseriesThresholds(timeseries: AssetInstanceDetails): ChartThreshold[] {
  const seriesId = getTimeseriesKey(timeseries);
  const unit = getTimeseriesUnit(timeseries) ?? '';

  return LIMIT_PROPERTIES.flatMap(({ identifier, label, level, side }) => {
    const text = getPropertyValue(timeseries, identifier);

    const value = text === undefined || text.trim() === '' ? Number.NaN : Number(text);
    if (!Number.isFinite(value)) return [];

    return [
      {
        id: `${seriesId}:${identifier}`,
        seriesId,
        level,
        side,
        value,
        unit,
        source: ThresholdSource.DATA_SOURCE,
        label,
      },
    ];
  });
}
