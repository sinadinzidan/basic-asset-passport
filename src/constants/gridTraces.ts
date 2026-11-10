import type { GridTrace } from '../types/gridTrace';

/** Rows and columns count the major grid cells of the page (`--grid-cell` in styles.css). Staggered so there is rarely more than one light moving at a time. */
export const GRID_TRACES: readonly GridTrace[] = [
  { axis: 'ROW', line: 1, from: 0, to: 4, durationSeconds: 8, delaySeconds: 0 },
  { axis: 'COLUMN', line: 2, from: 0, to: 3, durationSeconds: 9, delaySeconds: 2 },
  { axis: 'ROW', line: 3, from: 3, to: 8, durationSeconds: 10, delaySeconds: 4 },
  { axis: 'COLUMN', line: 5, from: 1, to: 4, durationSeconds: 8, delaySeconds: 6 },
  { axis: 'ROW', line: 2, from: 1, to: 6, durationSeconds: 11, delaySeconds: 8 },
  { axis: 'COLUMN', line: 7, from: 0, to: 2, durationSeconds: 9, delaySeconds: 10 },
];
