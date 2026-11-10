import { UnitFamily } from '../../enums/timeSeriesChart';

interface UnitDefinition {
  symbol: string;
  family: UnitFamily;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const linear = (symbol: string, family: UnitFamily, factor: number): UnitDefinition => ({
  symbol,
  family,
  toBase: (value) => value * factor,
  fromBase: (value) => value / factor,
});

const KELVIN_OFFSET = 273.15;
const FAHRENHEIT_OFFSET = 32;
const FAHRENHEIT_RATIO = 5 / 9;
const SECONDS_PER_HOUR = 3600;
const LITRES_PER_CUBIC_METRE = 1000;
const MILLIMETRES_PER_INCH = 25.4;
const KILOGRAMS_PER_TONNE = 1000;
const PASCALS_PER_BAR = 100_000;
const PASCALS_PER_PSI = 6894.757;
const WATTS_PER_HORSEPOWER = 745.7;
const REVOLUTIONS_PER_MINUTE_PER_HERTZ = 60;

/**
 * The conversions the chart may apply. Each is a documented rule; any other pair is refused rather than guessed.
 * Gauge and absolute pressure are different families on purpose: converting between them needs an atmospheric pressure
 * that the chart does not know.
 */
const UNITS: readonly UnitDefinition[] = [
  { symbol: '°C', family: UnitFamily.TEMPERATURE, toBase: (value) => value, fromBase: (value) => value },
  {
    symbol: '°F',
    family: UnitFamily.TEMPERATURE,
    toBase: (value) => (value - FAHRENHEIT_OFFSET) * FAHRENHEIT_RATIO,
    fromBase: (value) => value / FAHRENHEIT_RATIO + FAHRENHEIT_OFFSET,
  },
  {
    symbol: 'K',
    family: UnitFamily.TEMPERATURE,
    toBase: (value) => value - KELVIN_OFFSET,
    fromBase: (value) => value + KELVIN_OFFSET,
  },
  linear('barg', UnitFamily.PRESSURE_GAUGE, 1),
  linear('kPag', UnitFamily.PRESSURE_GAUGE, 1 / 100),
  linear('psig', UnitFamily.PRESSURE_GAUGE, PASCALS_PER_PSI / PASCALS_PER_BAR),
  linear('bar', UnitFamily.PRESSURE_ABSOLUTE, 1),
  linear('kPa', UnitFamily.PRESSURE_ABSOLUTE, 1 / 100),
  linear('MPa', UnitFamily.PRESSURE_ABSOLUTE, 10),
  linear('psi', UnitFamily.PRESSURE_ABSOLUTE, PASCALS_PER_PSI / PASCALS_PER_BAR),
  linear('mm/s', UnitFamily.VELOCITY, 1),
  linear('in/s', UnitFamily.VELOCITY, MILLIMETRES_PER_INCH),
  linear('m³/h', UnitFamily.VOLUME_FLOW, 1),
  linear('l/s', UnitFamily.VOLUME_FLOW, SECONDS_PER_HOUR / LITRES_PER_CUBIC_METRE),
  linear('m³/s', UnitFamily.VOLUME_FLOW, SECONDS_PER_HOUR),
  linear('t/h', UnitFamily.MASS_FLOW, 1),
  linear('kg/s', UnitFamily.MASS_FLOW, SECONDS_PER_HOUR / KILOGRAMS_PER_TONNE),
  linear('A', UnitFamily.ELECTRIC_CURRENT, 1),
  linear('mA', UnitFamily.ELECTRIC_CURRENT, 1 / 1000),
  linear('rpm', UnitFamily.ROTATIONAL_SPEED, 1),
  linear('Hz', UnitFamily.ROTATIONAL_SPEED, REVOLUTIONS_PER_MINUTE_PER_HERTZ),
  linear('kW', UnitFamily.POWER, 1),
  linear('MW', UnitFamily.POWER, 1000),
  linear('hp', UnitFamily.POWER, WATTS_PER_HORSEPOWER / 1000),
];

function definitionOf(unit: string | undefined): UnitDefinition | undefined {
  return unit === undefined ? undefined : UNITS.find((candidate) => candidate.symbol === unit);
}

export function convertibleUnits(unit: string): string[] {
  const definition = definitionOf(unit);
  if (!definition) return [unit];
  return [
    unit,
    ...UNITS.filter((candidate) => candidate.family === definition.family && candidate.symbol !== unit).map(
      (candidate) => candidate.symbol,
    ),
  ];
}

export function canConvert(from: string | undefined, to: string | undefined): boolean {
  if (from === to) return true;
  const source = definitionOf(from);
  const target = definitionOf(to);
  return source !== undefined && target !== undefined && source.family === target.family;
}

export function convertValue(value: number, from: string | undefined, to: string | undefined): number | undefined {
  if (from === to) return value;
  const source = definitionOf(from);
  const target = definitionOf(to);
  if (!source || !target || source.family !== target.family) return undefined;
  return target.fromBase(source.toBase(value));
}
