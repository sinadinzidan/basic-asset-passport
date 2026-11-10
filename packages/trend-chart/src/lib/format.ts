import { chartTimeZone, zonedFormat } from './timeZone';

const MISSING_VALUE = '---';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const dateFormat = () => zonedFormat({ day: '2-digit', month: 'numeric', year: 'numeric' });
const timeFormat = () => zonedFormat({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function readPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? '';
}

export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return MISSING_VALUE;
  const parts = dateFormat().formatToParts(new Date(isoDate));
  const monthName = MONTH_NAMES[Number(readPart(parts, 'month')) - 1] ?? '';
  return `${readPart(parts, 'day')}-${monthName}-${readPart(parts, 'year')}`;
}

export function formatDateTime(isoDate: string | undefined): string {
  if (!isoDate) return MISSING_VALUE;
  const timeParts = timeFormat().formatToParts(new Date(isoDate));
  return `${formatDate(isoDate)} ${readPart(timeParts, 'hour')}:${readPart(timeParts, 'minute')} ${chartTimeZone().label}`;
}

export function formatShortDateTime(isoDate: string | undefined): string {
  if (!isoDate) return MISSING_VALUE;
  const dateParts = dateFormat().formatToParts(new Date(isoDate));
  const timeParts = timeFormat().formatToParts(new Date(isoDate));
  const monthName = MONTH_NAMES[Number(readPart(dateParts, 'month')) - 1] ?? '';
  return `${Number(readPart(dateParts, 'day'))} ${monthName}, ${readPart(timeParts, 'hour')}:${readPart(timeParts, 'minute')}`;
}

/** One formatter for each number of decimals: building one is far slower than using it, and a chart readout formats a dozen values on every pointer move. */
const NUMBER_FORMATS = new Map<number, Intl.NumberFormat>();

function numberFormatFor(fractionDigits: number): Intl.NumberFormat {
  const existing = NUMBER_FORMATS.get(fractionDigits);
  if (existing) return existing;
  const created = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  NUMBER_FORMATS.set(fractionDigits, created);
  return created;
}

export function formatNumber(value: number | undefined, fractionDigits = 0): string {
  if (value === undefined || Number.isNaN(value)) return MISSING_VALUE;
  return numberFormatFor(fractionDigits).format(value);
}

export { MISSING_VALUE };
