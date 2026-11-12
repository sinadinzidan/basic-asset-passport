import { MILLISECONDS_PER_MINUTE } from '../constants/monitoring';

const DEFAULT_PAD_WIDTH = 2;
const YEAR_PAD_WIDTH = 4;
export interface ChartTimeZone {
  /** An IANA zone name, such as "Europe/Oslo". */
  id: string;
  /** What follows a time stamp, such as "CET". */
  label: string;
}

const UTC: ChartTimeZone = { id: 'UTC', label: 'UTC' };

let current = UTC;

/** The zone the chart shows and reads times in. It is UTC until the host sets another. */
export function setChartTimeZone(zone: ChartTimeZone): void {
  current = zone;
}

export function chartTimeZone(): ChartTimeZone {
  return current;
}

const FORMATS = new Map<string, Intl.DateTimeFormat>();

/** A formatter in the chart's zone; building one is slow, so each zone and set of options is built once. */
export function zonedFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${current.id}|${JSON.stringify(options)}`;
  const existing = FORMATS.get(key);
  if (existing) return existing;
  const created = new Intl.DateTimeFormat('en-GB', { timeZone: current.id, ...options });
  FORMATS.set(key, created);
  return created;
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function wallClockAt(ms: number): WallClock {
  const parts = zonedFormat({
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
  };
}

const pad = (value: number, width = DEFAULT_PAD_WIDTH): string =>
  String(value).padStart(width, '0');

/** An instant as "YYYY-MM-DDTHH:mm" on the wall clock of the chart's zone. */
export function toZonedInput(ms: number): string {
  const { year, month, day, hour, minute } = wallClockAt(ms);
  return `${pad(year, YEAR_PAD_WIDTH)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** The instant a wall-clock "YYYY-MM-DDTHH:mm" of the chart's zone names; undefined when the text is not a time. */
export function fromZonedInput(text: string): number | undefined {
  const wallAsUtc = new Date(`${text}:00.000Z`).getTime();
  if (Number.isNaN(wallAsUtc)) return undefined;
  const offsetAt = (ms: number): number => {
    const { year, month, day, hour, minute } = wallClockAt(ms);
    return (
      Date.UTC(year, month - 1, day, hour, minute) -
      Math.floor(ms / MILLISECONDS_PER_MINUTE) * MILLISECONDS_PER_MINUTE
    );
  };
  const first = wallAsUtc - offsetAt(wallAsUtc);
  return wallAsUtc - offsetAt(first);
}
