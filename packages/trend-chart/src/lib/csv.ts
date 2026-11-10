import { toZonedInput } from './timeZone';

/** <module>_<scope>_<YYYYMMDD-HHmm>.csv, the time in the chart's zone. */
export function buildExportFileName(moduleName: string, scope: string, now: Date): string {
  const stamp = toZonedInput(now.getTime()).replace(/[-:]/g, '').replace('T', '-');
  const clean = (text: string): string =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${clean(moduleName)}_${clean(scope)}_${stamp}.csv`;
}
