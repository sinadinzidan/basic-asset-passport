import { GridTraceAxis } from '../enums/gridTraceAxis';
import type { GridTrace } from '../types/gridTrace';

export const GRID_TRACES: readonly GridTrace[] = [
  { axis: GridTraceAxis.ROW, line: 1, from: 0, to: 4, durationSeconds: 8, delaySeconds: 0 },
  { axis: GridTraceAxis.COLUMN, line: 2, from: 0, to: 3, durationSeconds: 9, delaySeconds: 2 },
  { axis: GridTraceAxis.ROW, line: 3, from: 3, to: 8, durationSeconds: 10, delaySeconds: 4 },
  { axis: GridTraceAxis.COLUMN, line: 5, from: 1, to: 4, durationSeconds: 8, delaySeconds: 6 },
  { axis: GridTraceAxis.ROW, line: 2, from: 1, to: 6, durationSeconds: 11, delaySeconds: 8 },
  { axis: GridTraceAxis.COLUMN, line: 7, from: 0, to: 2, durationSeconds: 9, delaySeconds: 10 },
];
