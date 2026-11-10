export type GridTraceAxis = 'ROW' | 'COLUMN';

/**
 * A short light that runs along one line of the page's engineering grid, from
 * one crossing to another. Positions count grid cells from the top-left corner.
 */
export type GridTrace = {
  axis: GridTraceAxis;
  /** The row (for ROW) or column (for COLUMN) the light runs along. */
  line: number;
  from: number;
  to: number;
  /** One run plus the pause before the next, in seconds. */
  durationSeconds: number;
  delaySeconds: number;
};
