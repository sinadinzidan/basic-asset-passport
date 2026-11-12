import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_MINUTE } from '../../../../constants/monitoring';
import { ChartMode } from '../../../../enums/monitoring';
import { ChartTimersContext } from '../../../../hooks/time-series-chart/useChartTimers';
import { createPoints, createSeriesView } from '../../../../mocks/chartData';
import { createManualFrameTimers } from '../../../../mocks/manualFrameTimers';
import type { ChartTimeRange } from '../../../../types/timeSeriesChart';
import { TimeSeriesPlot } from '../TimeSeriesPlot';
import type { TimeSeriesPlotProperties } from '../TimeSeriesPlot';

const HOUR_MS = 60 * MILLISECONDS_PER_MINUTE;
const WINDOW: ChartTimeRange = { start: 0, end: HOUR_MS };
const BOUNDS: ChartTimeRange = { start: -2 * HOUR_MS, end: 3 * HOUR_MS };

describe(TimeSeriesPlot.name, () => {
  describe('panning', () => {
    it('does not change the window while the pointer is still dragging it', () => {
      const { onWindowChange, overlay } = renderPlot();

      fireEvent.pointerDown(overlay(), { button: 0, shiftKey: true, clientX: 500 });
      fireEvent.pointerMove(overlay(), { clientX: 450 });
      fireEvent.pointerMove(overlay(), { clientX: 400 });
      fireEvent.pointerMove(overlay(), { clientX: 350 });

      expect(onWindowChange).not.toHaveBeenCalled();
    });

    it('shows the dragged window while the pointer drags, before the host has it', () => {
      const { overlay } = renderPlot();
      const axisBefore = screen.getByTestId('time-series-plot').textContent;

      fireEvent.pointerDown(overlay(), { button: 0, shiftKey: true, clientX: 500 });
      fireEvent.pointerMove(overlay(), { clientX: 300 });

      expect(screen.getByTestId('time-series-plot').textContent).not.toBe(axisBefore);
    });

    it('gives the host the window once, when the pointer is released', () => {
      const { onWindowChange, overlay } = renderPlot();

      fireEvent.pointerDown(overlay(), { button: 0, shiftKey: true, clientX: 500 });
      fireEvent.pointerMove(overlay(), { clientX: 450 });
      fireEvent.pointerMove(overlay(), { clientX: 300 });
      fireEvent.pointerUp(overlay(), { clientX: 300 });

      expect(onWindowChange).toHaveBeenCalledOnce();
      const [moved] = onWindowChange.mock.calls[0] ?? [];
      expect(moved.end - moved.start).toBe(HOUR_MS);
      expect(moved.start).toBeGreaterThan(WINDOW.start);
    });

    it('gives the host nothing when the pointer is released where it started', () => {
      const { onWindowChange, overlay } = renderPlot();

      fireEvent.pointerDown(overlay(), { button: 0, shiftKey: true, clientX: 500 });
      fireEvent.pointerUp(overlay(), { clientX: 500 });

      expect(onWindowChange).not.toHaveBeenCalled();
    });

    it('drops the dragged window when the drag is cancelled', () => {
      const { onWindowChange, overlay } = renderPlot();
      const axisBefore = screen.getByTestId('time-series-plot').textContent;

      fireEvent.pointerDown(overlay(), { button: 0, shiftKey: true, clientX: 500 });
      fireEvent.pointerMove(overlay(), { clientX: 300 });
      fireEvent.pointerCancel(overlay());

      expect(onWindowChange).not.toHaveBeenCalled();
      expect(screen.getByTestId('time-series-plot').textContent).toBe(axisBefore);
    });
  });

  describe('crosshair', () => {
    it('follows the pointer once per frame, however many moves come before it', () => {
      const { overlay, frames } = renderPlot();

      fireEvent.pointerMove(overlay(), { clientX: 200 });
      fireEvent.pointerMove(overlay(), { clientX: 250 });
      fireEvent.pointerMove(overlay(), { clientX: 300 });
      const requested = frames.pendingCount();
      const shownBeforeTheFrame = screen.queryByTestId('crosshair');
      act(() => frames.runFrame());

      expect(requested).toBe(1);
      expect(shownBeforeTheFrame).not.toBeInTheDocument();
      expect(screen.getByTestId('crosshair')).toBeInTheDocument();
    });

    it('goes at once when the pointer leaves, even with a move waiting for a frame', () => {
      const { overlay, frames } = renderPlot();
      fireEvent.pointerMove(overlay(), { clientX: 200 });
      act(() => frames.runFrame());
      fireEvent.pointerMove(overlay(), { clientX: 300 });

      fireEvent.pointerLeave(overlay());
      act(() => frames.runFrame());

      expect(screen.queryByTestId('crosshair')).not.toBeInTheDocument();
    });
  });
});

function renderPlot(overrides: Partial<TimeSeriesPlotProperties> = {}) {
  const frames = createManualFrameTimers();
  const onWindowChange = vi.fn<(window: ChartTimeRange) => void>();
  const properties: TimeSeriesPlotProperties = {
    series: [
      createSeriesView({
        points: createPoints(Array.from({ length: 60 }, (_unused, index) => index)),
      }),
    ],
    window: WINDOW,
    bounds: BOUNDS,
    mode: ChartMode.OVERLAID,
    axes: [],
    shouldShowGridlines: true,
    shouldShowMinMax: false,
    shouldShowThresholds: false,
    shouldShowGaps: false,
    shouldShowBand: false,
    events: [],
    isMarkerMode: false,
    markerAt: undefined,
    isInterpolated: false,
    nowMs: HOUR_MS,
    isLive: false,
    onWindowChange,
    onMarkerChange: vi.fn(),
    summary: 'Discharge pressure over the last hour',
    ...overrides,
  };
  const rendered = render(
    <ChartTimersContext.Provider value={frames.timers}>
      <TimeSeriesPlot {...properties} />
    </ChartTimersContext.Provider>,
  );
  return {
    ...rendered,
    frames,
    onWindowChange,
    overlay: (): HTMLElement => screen.getByRole('group'),
  };
}
