import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, Ref } from 'react';

import { CHART_LANE_HEIGHT_PX, CHART_MIN_DRAG_PX } from '../../../constants/monitoring';
import {
  CHART_PAN_KEYBOARD_RATIO,
  CHART_PLOT_MIN_HEIGHT_PX,
  CHART_WHEEL_ZOOM_FACTOR,
} from '../../../constants/timeSeriesChart';
import type { ChartMode } from '../../../enums/monitoring';
import { LANE_GAP_PX, PLOT_TOP_PX, TIME_AXIS_HEIGHT_PX, buildPlotModel } from '../../../lib/monitoring/plotModel';
import { formatPlotTimestamp } from '../../../lib/time-series-chart/plotFormat';
import {
  dragWindow,
  isSameWindow,
  panWindow,
  plotWidth,
  timeToX,
  windowSpan,
  xToTime,
  zoomWindow,
} from '../../../lib/time-series-chart/plotNavigation';
import type { PlotGeometry } from '../../../lib/time-series-chart/plotNavigation';
import {
  describeHover,
  describeMarkerReading,
  readHover,
  readMarker,
} from '../../../lib/time-series-chart/plotReadouts';
import { buildPlotSeries, limitValuesOf } from '../../../lib/time-series-chart/plotSeries';
import { cn } from '../../../lib/utils';
import type { AxisSetting, ChartEvent, ChartSeriesView, ChartTimeRange } from '../../../types/timeSeriesChart';

import { EventButton } from './EventButton';
import { PlotCursorLayer } from './PlotCursorLayer';
import { PlotLayer } from './PlotLayer';
import {
  EVENT_BOTTOM_INSET_PX,
  FALLBACK_WIDTH_PX,
  KEYBOARD_JUMP_RATIO,
  KEYBOARD_STEP_RATIO,
  MARKER_GRAB_DISTANCE_PX,
  PLOT_HELP_LABEL,
  PLOT_MARKER_HELP_LABEL,
  WHEEL_LINE_HEIGHT_PX,
} from './plotLayout';
import { PlotReadoutCard } from './PlotReadoutCard';
import { useElementWidth } from './useElementWidth';

export interface TimeSeriesPlotProps {
  /** Visible numeric series only, in configured order. Points are already in `unit` (display unit applied) and in timestamp order; they are NOT cut to the window. */
  series: readonly ChartSeriesView[];
  window: ChartTimeRange;
  bounds: ChartTimeRange;
  mode: ChartMode;
  axes: readonly AxisSetting[];
  showGridlines: boolean;
  showMinMax: boolean;
  showThresholds: boolean;
  showGaps: boolean;
  showBand: boolean;
  events: readonly ChartEvent[];
  isMarkerMode: boolean;
  markerAt: number | undefined;
  /** The marker may read interpolated values only when true; they are then labelled as interpolated. */
  isInterpolated: boolean;
  nowMs: number;
  isLive: boolean;
  onWindowChange: (window: ChartTimeRange) => void;
  onMarkerChange: (at: number | undefined) => void;
  onEventSelect?: (event: ChartEvent) => void;
  onPointClick?: (atMs: number) => void;
  heightPx?: number;
  summary: string;
  svgRef?: Ref<SVGSVGElement>;
}

type DragState =
  | { kind: 'ZOOM'; startMs: number; startClientX: number; currentClientX: number; currentMs: number }
  | { kind: 'PAN'; startClientX: number; startWindow: ChartTimeRange }
  | { kind: 'MARKER' };

/**
 * The plot of the time-series chart: lines per series on a shared time axis, in
 * overlaid, normalised or stacked form, with gridlines, min/max indicators, thresholds, gaps, events, a hover crosshair or a
 * vertical marker with its readout, and zoom and pan by pointer, wheel and keyboard. It draws what it is given; the window,
 * the marker and the configuration belong to the parent, and only the crosshair is local.
 */
export function TimeSeriesPlot({
  series,
  window: visibleWindowProp,
  bounds: boundsProp,
  mode,
  axes,
  showGridlines,
  showMinMax,
  showThresholds,
  showGaps,
  showBand,
  events,
  isMarkerMode,
  markerAt,
  isInterpolated,
  nowMs,
  isLive,
  onWindowChange,
  onMarkerChange,
  onEventSelect,
  onPointClick,
  heightPx = CHART_PLOT_MIN_HEIGHT_PX,
  summary,
  svgRef,
}: TimeSeriesPlotProps) {
  const idPrefix = useId();
  const [containerRef, measuredWidth] = useElementWidth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [crosshairAt, setCrosshairAt] = useState<number | undefined>();
  const [drag, setDrag] = useState<DragState | undefined>();

  const width = measuredWidth > 0 ? measuredWidth : FALLBACK_WIDTH_PX;
  const visibleWindow = useMemo<ChartTimeRange>(
    () => ({ start: visibleWindowProp.start, end: visibleWindowProp.end }),
    [visibleWindowProp.start, visibleWindowProp.end],
  );
  const bounds = useMemo<ChartTimeRange>(
    () => ({ start: boundsProp.start, end: boundsProp.end }),
    [boundsProp.start, boundsProp.end],
  );

  const plotSeries = useMemo(
    () => series.map((view) => buildPlotSeries(view, visibleWindow, { showMinMax, showThresholds })),
    [series, visibleWindow, showMinMax, showThresholds],
  );
  const model = useMemo(() => {
    const availableHeight = heightPx - PLOT_TOP_PX - TIME_AXIS_HEIGHT_PX;
    const laneCount = Math.max(1, plotSeries.length);
    const laneHeight = Math.max(
      CHART_LANE_HEIGHT_PX,
      Math.floor((availableHeight - (laneCount - 1) * LANE_GAP_PX) / laneCount),
    );
    return buildPlotModel({
      series: plotSeries.map((entry) => ({
        id: entry.id,
        unit: entry.unit,
        buckets: entry.buckets,
        limits: limitValuesOf(entry.thresholds),
        showLimits: entry.thresholds.length > 0,
      })),
      mode,
      width,
      plotHeight: availableHeight,
      laneHeight,
      showBand,
      axes,
    });
  }, [plotSeries, mode, width, showBand, axes, heightPx]);
  const geometry = useMemo<PlotGeometry>(() => {
    const firstLane = model.lanes[0];
    const lastLane = model.lanes[model.lanes.length - 1];
    return {
      left: model.plotLeft,
      right: model.plotRight,
      top: firstLane?.top ?? PLOT_TOP_PX,
      bottom: lastLane ? lastLane.top + lastLane.height : model.height - TIME_AXIS_HEIGHT_PX,
      window: visibleWindow,
    };
  }, [model, visibleWindow]);

  const plotWidthPx = plotWidth(geometry);
  const spanMs = windowSpan(visibleWindow);
  const isMarkerShown =
    isMarkerMode && markerAt !== undefined && markerAt >= visibleWindow.start && markerAt <= visibleWindow.end;
  const hoveredAt = isMarkerMode ? undefined : crosshairAt;
  const hasSeries = plotSeries.length > 0;

  const hover = useMemo(
    () => (hoveredAt === undefined ? undefined : { atMs: hoveredAt, readings: readHover(plotSeries, hoveredAt) }),
    [hoveredAt, plotSeries],
  );
  const marker = useMemo(
    () =>
      isMarkerShown && markerAt !== undefined
        ? { atMs: markerAt, readings: readMarker(plotSeries, markerAt, isInterpolated) }
        : undefined,
    [isMarkerShown, markerAt, plotSeries, isInterpolated],
  );
  const hoverX = hover ? timeToX(geometry, hover.atMs) : undefined;
  const markerX = marker ? timeToX(geometry, marker.atMs) : undefined;
  const visibleEvents = useMemo(
    () => events.filter((event) => event.at >= visibleWindow.start && event.at <= visibleWindow.end),
    [events, visibleWindow],
  );

  const overlayLeft = (): number => overlayRef.current?.getBoundingClientRect().left ?? 0;
  const pointerMs = (clientX: number): number => xToTime(geometry, clientX - overlayLeft());
  const commitWindow = useCallback(
    (next: ChartTimeRange): void => {
      if (!isSameWindow(next, visibleWindow)) onWindowChange(next);
    },
    [onWindowChange, visibleWindow],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 && event.button !== 1) return;
    const target = event.currentTarget;
    if (typeof target.setPointerCapture === 'function') target.setPointerCapture(event.pointerId);
    const atMs = pointerMs(event.clientX);
    if (event.button === 1 || event.shiftKey) {
      setDrag({ kind: 'PAN', startClientX: event.clientX, startWindow: visibleWindow });
    } else if (
      markerX !== undefined &&
      Math.abs(event.clientX - overlayLeft() - (markerX - geometry.left)) <= MARKER_GRAB_DISTANCE_PX
    ) {
      setDrag({ kind: 'MARKER' });
    } else {
      setDrag({
        kind: 'ZOOM',
        startMs: atMs,
        startClientX: event.clientX,
        currentClientX: event.clientX,
        currentMs: atMs,
      });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const atMs = pointerMs(event.clientX);
    if (!drag) {
      if (!isMarkerMode) setCrosshairAt(atMs);
      return;
    }
    if (drag.kind === 'ZOOM') {
      if (!isMarkerMode) setCrosshairAt(atMs);
      setDrag({ ...drag, currentClientX: event.clientX, currentMs: atMs });
    } else if (drag.kind === 'PAN') {
      const deltaMs = (-(event.clientX - drag.startClientX) / plotWidthPx) * windowSpan(drag.startWindow);
      commitWindow(panWindow(drag.startWindow, bounds, deltaMs));
    } else {
      onMarkerChange(atMs);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const atMs = pointerMs(event.clientX);
    if (drag?.kind === 'ZOOM') {
      if (Math.abs(event.clientX - drag.startClientX) >= CHART_MIN_DRAG_PX) {
        const zoomed = dragWindow(bounds, drag.startMs, atMs);
        if (zoomed) commitWindow(zoomed);
      } else if (isMarkerMode) {
        onMarkerChange(atMs);
      } else {
        onPointClick?.(atMs);
      }
    } else if (drag?.kind === 'MARKER') {
      onMarkerChange(atMs);
    }
    setDrag(undefined);
  };

  const keyboardAnchor = (): number => (marker ? marker.atMs : (hoveredAt ?? visibleWindow.start + spanMs / 2));

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    switch (event.key) {
      case 'Escape':
        if (isMarkerMode && markerAt !== undefined) {
          event.stopPropagation();
          onMarkerChange(undefined);
        } else if (crosshairAt !== undefined) {
          event.stopPropagation();
          setCrosshairAt(undefined);
        }
        return;
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault();
        const step =
          spanMs * (event.shiftKey ? KEYBOARD_JUMP_RATIO : KEYBOARD_STEP_RATIO) * (event.key === 'ArrowLeft' ? -1 : 1);
        const start = isMarkerMode ? (markerAt ?? visibleWindow.end) : (crosshairAt ?? visibleWindow.end);
        const next = Math.min(visibleWindow.end, Math.max(visibleWindow.start, start + step));
        if (isMarkerMode) onMarkerChange(next);
        else setCrosshairAt(next);
        return;
      }
      case '+':
      case '=':
        event.preventDefault();
        commitWindow(zoomWindow(visibleWindow, bounds, 1 / CHART_WHEEL_ZOOM_FACTOR, keyboardAnchor()));
        return;
      case '-':
      case '_':
        event.preventDefault();
        commitWindow(zoomWindow(visibleWindow, bounds, CHART_WHEEL_ZOOM_FACTOR, keyboardAnchor()));
        return;
      case 'PageUp':
      case 'PageDown':
        event.preventDefault();
        commitWindow(
          panWindow(visibleWindow, bounds, spanMs * CHART_PAN_KEYBOARD_RATIO * (event.key === 'PageUp' ? -1 : 1)),
        );
        return;
      default:
    }
  };

  // Ctrl or Cmd with the wheel zooms around the pointer; a horizontal wheel or Shift with the wheel pans. A plain vertical wheel is
  const handleWheel = useCallback(
    (event: WheelEvent): void => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const lineScale = event.deltaMode === 1 ? WHEEL_LINE_HEIGHT_PX : 1;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        if (event.deltaY === 0) return;
        const anchor = xToTime(geometry, event.clientX - overlay.getBoundingClientRect().left);
        commitWindow(
          zoomWindow(
            visibleWindow,
            bounds,
            event.deltaY < 0 ? 1 / CHART_WHEEL_ZOOM_FACTOR : CHART_WHEEL_ZOOM_FACTOR,
            anchor,
          ),
        );
        return;
      }
      const isHorizontal = event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const delta = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
      if (!isHorizontal || delta === 0) return;
      event.preventDefault();
      commitWindow(panWindow(visibleWindow, bounds, ((delta * lineScale) / plotWidthPx) * windowSpan(visibleWindow)));
    },
    [geometry, visibleWindow, bounds, plotWidthPx, commitWindow],
  );

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return undefined;
    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => overlay.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const selection =
    drag?.kind === 'ZOOM' && Math.abs(drag.currentClientX - drag.startClientX) >= CHART_MIN_DRAG_PX
      ? { fromMs: Math.min(drag.startMs, drag.currentMs), toMs: Math.max(drag.startMs, drag.currentMs) }
      : undefined;
  const cardTop = geometry.top + 6;
  const isOnLeft = (x: number): boolean => x > geometry.left + plotWidthPx * 0.55;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height: model.height }}
      data-testid="time-series-plot"
      data-gridlines={String(showGridlines)}
      data-mode={model.mode}
      data-normalised-fallback={String(model.didSwitchToNormalised)}
    >
      <div
        ref={overlayRef}
        tabIndex={0}
        role="group"
        aria-label={isMarkerMode ? PLOT_MARKER_HELP_LABEL : PLOT_HELP_LABEL}
        className={cn(
          'absolute rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          drag?.kind === 'PAN' ? 'cursor-grabbing' : 'cursor-crosshair',
        )}
        style={{
          left: geometry.left,
          top: geometry.top,
          width: plotWidthPx,
          height: Math.max(1, geometry.bottom - geometry.top),
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(undefined)}
        onPointerLeave={() => {
          if (!drag) setCrosshairAt(undefined);
        }}
        onMouseDown={(event) => {
          if (event.button === 1) event.preventDefault();
        }}
        onKeyDown={handleKeyDown}
      />

      <svg
        ref={svgRef}
        width={width}
        height={model.height}
        role="img"
        aria-label={summary}
        className="pointer-events-none absolute inset-0"
        style={{ willChange: 'transform' }}
        xmlns="http://www.w3.org/2000/svg"
        data-gridlines={String(showGridlines)}
      >
        <PlotLayer
          model={model}
          geometry={geometry}
          series={plotSeries}
          showGridlines={showGridlines}
          showGaps={showGaps}
          showBand={showBand}
          events={events}
          isLive={isLive}
          nowMs={isLive ? nowMs : 0}
          idPrefix={idPrefix}
        />
      </svg>
      <svg
        width={width}
        height={model.height}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
        data-plot-overlay
      >
        <PlotCursorLayer
          model={model}
          geometry={geometry}
          width={width}
          hover={hover}
          marker={marker}
          selection={selection}
        />
      </svg>

      {model.didSwitchToNormalised ? (
        <p className="pointer-events-none absolute right-2 top-0 z-10 text-[0.6875rem] text-muted-foreground">
          Too many axes for this width, so the series are normalised.
        </p>
      ) : null}

      {visibleEvents.map((event) => (
        <EventButton
          key={event.id}
          event={event}
          x={timeToX(geometry, event.at)}
          bottom={geometry.bottom - EVENT_BOTTOM_INSET_PX}
          onSelect={onEventSelect}
        />
      ))}

      {hover && hoverX !== undefined && hasSeries ? (
        <PlotReadoutCard
          title={formatPlotTimestamp(hover.atMs)}
          rows={hover.readings.map(describeHover)}
          anchorX={hoverX}
          top={cardTop}
          isOnLeft={isOnLeft(hoverX)}
          testId="chart-hover-card"
        />
      ) : null}
      {marker && markerX !== undefined && hasSeries ? (
        <PlotReadoutCard
          title={formatPlotTimestamp(marker.atMs)}
          rows={marker.readings.map(describeMarkerReading)}
          anchorX={markerX}
          top={cardTop}
          isOnLeft={isOnLeft(markerX)}
          testId="marker-readout"
          isAnnounced
        />
      ) : null}
    </div>
  );
}
