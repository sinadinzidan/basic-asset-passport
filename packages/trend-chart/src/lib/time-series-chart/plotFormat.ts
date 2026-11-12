import { formatDate } from '../format';
import { chartTimeZone, zonedFormat } from '../timeZone';

const timeWithSeconds = () =>
  zonedFormat({ hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });

/** DD-MMM-YYYY HH:mm:ss and the zone: the time stamp of a crosshair or a marker, with seconds because the window may be only a minute wide. */
export function formatPlotTimestamp(atMs: number): string {
  const date = new Date(atMs);
  return `${formatDate(date.toISOString())} ${timeWithSeconds().format(date)} ${chartTimeZone().label}`;
}
