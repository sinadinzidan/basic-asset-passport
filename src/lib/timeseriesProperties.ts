import { MODEL } from '../config/model';
import {
  NUMERIC_TIMESERIES_TYPE,
  TIMESERIES_DISPLAY_PROPERTIES,
  TIMESERIES_UNIT_PROPERTIES,
} from '../constants/timeseries';
import type { AssetInstanceDetails } from '../types/asset';
import type { PropertyDisplay } from '../types/property';
import type { TimeseriesIdentifier } from '../types/timeseries';

import { getPropertyValue } from './assetProperties';
import { getInstanceKey } from './instanceKey';

export function getTimeseriesKey(timeseries: TimeseriesIdentifier): string {
  return getInstanceKey(timeseries);
}

export function getTimeseriesName(timeseries: AssetInstanceDetails): string {
  return getPropertyValue(timeseries, MODEL.properties.asset.name) ?? timeseries.externalId;
}

export function isNonNumericTimeseries(timeseries: AssetInstanceDetails): boolean {
  const type = getPropertyValue(timeseries, MODEL.properties.timeseries.type);

  return type !== undefined && type.toLowerCase() !== NUMERIC_TIMESERIES_TYPE;
}

export function getTimeseriesUnit(timeseries: AssetInstanceDetails): string | null {
  for (const identifier of TIMESERIES_UNIT_PROPERTIES) {
    const unit = getPropertyValue(timeseries, identifier);

    if (unit) return unit;
  }

  return null;
}

export function getTimeseriesDisplayProperties(
  timeseries: AssetInstanceDetails,
): PropertyDisplay[] {
  const shown = TIMESERIES_DISPLAY_PROPERTIES.flatMap((identifier) => {
    const property = timeseries.properties.find((candidate) => candidate.identifier === identifier);

    return property ? [property] : [];
  });

  return shown.length > 0 ? shown : timeseries.properties;
}
