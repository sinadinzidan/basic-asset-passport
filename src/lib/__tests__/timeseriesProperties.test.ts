import { describe, expect, it } from 'vitest';

import { makeInstanceDetails } from '../../__mocks__/assets';
import {
  getTimeseriesDisplayProperties,
  getTimeseriesKey,
  getTimeseriesName,
  getTimeseriesUnit,
  isNonNumericTimeseries,
} from '../timeseriesProperties';

describe(getTimeseriesKey.name, () => {
  it('joins the space and the external ID', () => {
    expect(getTimeseriesKey({ space: 'ts', externalId: 'PI.1' })).toBe('ts:PI.1');
  });
});

describe(getTimeseriesName.name, () => {
  it('reads the name the series carries', () => {
    const series = makeInstanceDetails({
      externalId: 'PI.9',
      properties: [{ identifier: 'name', label: 'Name', value: 'Pressure' }],
    });

    expect(getTimeseriesName(series)).toBe('Pressure');
  });

  it('falls back to the external ID when the series has no name', () => {
    expect(getTimeseriesName({ space: 'ts', externalId: 'PI.9', properties: [] })).toBe('PI.9');
  });
});

describe(isNonNumericTimeseries.name, () => {
  it.each([
    ['string', true],
    ['STRING', true],
    ['state', true],
    ['numeric', false],
    ['NUMERIC', false],
  ])('treats type %s as non-numeric: %s', (type, isExpectedNonNumeric) => {
    const series = makeInstanceDetails({
      properties: [{ identifier: 'type', label: 'Type', value: type }],
    });

    expect(isNonNumericTimeseries(series)).toBe(isExpectedNonNumeric);
  });

  it('treats a series without a type as numeric', () => {
    expect(isNonNumericTimeseries(makeInstanceDetails({ properties: [] }))).toBe(false);
  });
});

describe(getTimeseriesUnit.name, () => {
  it('reads the engineering unit', () => {
    const series = makeInstanceDetails({
      properties: [{ identifier: 'engunits', label: 'Engineering Units', value: 'bar' }],
    });

    expect(getTimeseriesUnit(series)).toBe('bar');
  });

  it('is null when there is none', () => {
    expect(getTimeseriesUnit(makeInstanceDetails({ properties: [] }))).toBeNull();
  });
});

describe(getTimeseriesDisplayProperties.name, () => {
  const property = (identifier: string) => ({
    identifier,
    label: identifier,
    value: '1',
  });

  it('shows only the properties meant for a card, in their set order', () => {
    const series = makeInstanceDetails({
      properties: ['compdev', 'engunits', 'name', 'description', 'excmax'].map(property),
    });

    expect(getTimeseriesDisplayProperties(series).map(({ identifier }) => identifier)).toEqual([
      'description',
      'engunits',
    ]);
  });

  it('falls back to every property when none are meant for a card', () => {
    const series = makeInstanceDetails({
      properties: ['alpha', 'beta'].map(property),
    });

    expect(getTimeseriesDisplayProperties(series)).toEqual(series.properties);
  });
});
