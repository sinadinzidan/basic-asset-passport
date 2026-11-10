import {
  NUMERIC_TIMESERIES_TYPE,
  TIMESERIES_DISPLAY_PROPERTIES,
  TIMESERIES_TYPE_PROPERTY,
  TIMESERIES_UNIT_PROPERTIES,
} from '../constants/timeseries';
import type {
  AssetInstanceDetails,
  AssetPropertyDisplay,
} from '../types/asset';
import type { TimeseriesIdentifier } from '../types/timeseries';

import { getPropertyValue } from './assetProperties';

/** A stable key for a series, used for caches and as its ID in the chart. */
export function getTimeseriesKey({
  space,
  externalId,
}: TimeseriesIdentifier): string {
  return `${space}:${externalId}`;
}

/**
 * String and state series hold text or discrete states, not numbers, so they
 * have no trend to draw. A series without a type is treated as numeric.
 */
export function isNonNumericTimeseries(timeseries: AssetInstanceDetails): boolean {
  const type = getPropertyValue(timeseries, TIMESERIES_TYPE_PROPERTY);

  return type !== undefined && type.toLowerCase() !== NUMERIC_TIMESERIES_TYPE;
}

export function getTimeseriesUnit(
  timeseries: AssetInstanceDetails,
): string | null {
  for (const identifier of TIMESERIES_UNIT_PROPERTIES) {
    const unit = getPropertyValue(timeseries, identifier);
    if (unit) return unit;
  }

  return null;
}

/**
 * The properties worth showing on a series card, in their set order. When a
 * view holds none of them, every property is shown rather than an empty card.
 */
export function getTimeseriesDisplayProperties(
  timeseries: AssetInstanceDetails,
): AssetPropertyDisplay[] {
  const shown = TIMESERIES_DISPLAY_PROPERTIES.flatMap((identifier) => {
    const property = timeseries.properties.find(
      (candidate) => candidate.identifier === identifier,
    );
    return property ? [property] : [];
  });

  return shown.length > 0 ? shown : timeseries.properties;
}
