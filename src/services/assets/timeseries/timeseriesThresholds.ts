import {
  ThresholdLevel,
  ThresholdSide,
  ThresholdSource,
  type ChartThreshold,
} from '@flows/trend-chart';

import {
  DLE_HIGH_LABEL,
  DLE_LIMIT_MAX_PROPERTY,
  DLE_LIMIT_MIN_PROPERTY,
  DLE_LOW_LABEL,
  OWE_HIGH_LABEL,
  OWE_LIMIT_MAX_PROPERTY,
  OWE_LIMIT_MIN_PROPERTY,
  OWE_LOW_LABEL,
  TRIP_HIGH_LABEL,
  TRIP_LIMIT_MAX_PROPERTY,
  TRIP_LIMIT_MIN_PROPERTY,
  TRIP_LOW_LABEL,
} from '../../../constants/timeseries';
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
    identifier: OWE_LIMIT_MAX_PROPERTY,
    label: OWE_HIGH_LABEL,
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: OWE_LIMIT_MIN_PROPERTY,
    label: OWE_LOW_LABEL,
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.LOWER,
  },
  {
    identifier: DLE_LIMIT_MAX_PROPERTY,
    label: DLE_HIGH_LABEL,
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: DLE_LIMIT_MIN_PROPERTY,
    label: DLE_LOW_LABEL,
    level: ThresholdLevel.ALERT,
    side: ThresholdSide.LOWER,
  },
  {
    identifier: TRIP_LIMIT_MAX_PROPERTY,
    label: TRIP_HIGH_LABEL,
    level: ThresholdLevel.DANGER,
    side: ThresholdSide.UPPER,
  },
  {
    identifier: TRIP_LIMIT_MIN_PROPERTY,
    label: TRIP_LOW_LABEL,
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
