import { useCallback, useEffect, useRef, useState } from 'react';

import { useChartTimers } from '../../../hooks/time-series-chart/useChartTimers';

export interface Crosshair {
  /** The time the crosshair is at; undefined when there is none. */
  crosshairAt: number | undefined;
  /** For a pointer move: the crosshair moves on the next frame, to the last time given, however many moves come before it. */
  scheduleCrosshair: (atMs: number) => void;
  /** For anything else (keys, the pointer leaving): the crosshair moves now, and a move waiting for a frame is dropped. */
  setCrosshair: (atMs: number | undefined) => void;
}

/** The hover crosshair of the plot. A pointer fires far more moves than a screen shows frames, so the plot redraws once per frame. */
export function useCrosshair(): Crosshair {
  const timers = useChartTimers();
  const [crosshairAt, setCrosshairAt] = useState<number | undefined>();
  const pending = useRef<{ handle: number; atMs: number } | undefined>(undefined);

  const cancelPending = useCallback((): void => {
    if (pending.current === undefined) return;
    timers.cancelFrame(pending.current.handle);
    pending.current = undefined;
  }, [timers]);

  const setCrosshair = useCallback(
    (atMs: number | undefined): void => {
      cancelPending();
      setCrosshairAt(atMs);
    },
    [cancelPending],
  );

  const scheduleCrosshair = useCallback(
    (atMs: number): void => {
      if (pending.current !== undefined) {
        pending.current.atMs = atMs;
        return;
      }
      const entry = { handle: 0, atMs };
      pending.current = entry;
      entry.handle = timers.requestFrame(() => {
        pending.current = undefined;
        setCrosshairAt(entry.atMs);
      });
    },
    [timers],
  );

  useEffect(() => cancelPending, [cancelPending]);

  return { crosshairAt, scheduleCrosshair, setCrosshair };
}
