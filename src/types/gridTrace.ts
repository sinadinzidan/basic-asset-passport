import type { GridTraceAxis } from '../enums/gridTraceAxis';

export type GridTrace = {
  axis: GridTraceAxis;
  line: number;
  from: number;
  to: number;
  durationSeconds: number;
  delaySeconds: number;
};
