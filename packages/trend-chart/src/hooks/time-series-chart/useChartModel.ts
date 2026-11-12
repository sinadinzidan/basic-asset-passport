import type { QueryClient, UseQueryResult } from '@tanstack/react-query';
import { keepPreviousData, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { MILLISECONDS_PER_DAY } from '../../constants/formats';
import { CHART_ALL_HISTORY_DAYS } from '../../constants/monitoring';
import { CHART_MAX_SOURCE_POINTS } from '../../constants/timeSeriesChart';
import { ChartOverlay, ChartPanel, SeriesDataStatus } from '../../enums/timeSeriesChart';
import { resolveChartWindow } from '../../lib/monitoring/chartModel';
import { profileSeries } from '../../lib/time-series-chart/dataQuality';
import {
  buildMonitoringSnapshots,
  convertPoints,
  convertThresholds,
  deriveSeriesStatus,
} from '../../lib/time-series-chart/seriesView';
import { computeStatistics } from '../../lib/time-series-chart/statistics';
import { thinPoints } from '../../lib/time-series-chart/thinPoints';
import type {
  ChartAlert,
  ChartConfiguration,
  ChartEvent,
  ChartSeriesView,
  ChartTimeRange,
  DataProfile,
  MonitoringSnapshot,
  TimeSeriesData,
  TimeSeriesDefinition,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';
import { QUERY_ROOT } from '../core/queryRoot';
import { useStableValue } from '../core/useStableValue';

import { useChartAdapter, useChartScopeKey } from './useChartAdapter';

const CHART_QUERY_SEGMENT = 'time-series-chart';

interface UseChartModelInput {
  configuration: ChartConfiguration;
  nowMs: number;
  liveAppended: Readonly<Record<string, readonly TimeSeriesPoint[]>>;
  isLive: boolean;
}

export interface ChartModel {
  /** The visible window; while live it slides to keep the newest reading in view. */
  window: ChartTimeRange;
  bounds: ChartTimeRange;
  views: ChartSeriesView[];
  /** The readings as loaded, in each series' own unit and without what the live feed appended; the feed continues from these. */
  loadedPoints: Record<string, readonly TimeSeriesPoint[]>;
  visibleViews: ChartSeriesView[];
  events: ChartEvent[];
  alerts: { data: ChartAlert[]; isLoading: boolean; error: Error | undefined; refetch: () => void };
  profiles: DataProfile[];
  snapshots: MonitoringSnapshot[];
  /** Fetching series for a new window: the plot keeps the old readings meanwhile. */
  isRefreshing: boolean;
  retrySeries: (seriesId: string) => void;
}

const EMPTY_POINTS: readonly TimeSeriesPoint[] = [];

interface DefinitionState {
  definition: TimeSeriesDefinition | null | undefined;
  error: string | undefined;
  isPending: boolean;
}

interface ReadingState {
  points: readonly TimeSeriesPoint[] | undefined;
  error: string | undefined;
  isPending: boolean;
  isFetching: boolean;
}

/**
 * The queries are combined into plain states by functions that live outside the hook. Their result is shared structurally, so it keeps
 * its identity until a series really loads, fails or changes, and everything built from it is not rebuilt by an unrelated render.
 */
const combineDefinitions = (
  results: UseQueryResult<TimeSeriesDefinition | null>[],
): DefinitionState[] =>
  results.map((result) => ({
    definition: result.data,
    error: result.error?.message,
    isPending: result.isPending,
  }));
const combineReadings = (results: UseQueryResult<TimeSeriesData[]>[]): ReadingState[] =>
  results.map((result) => ({
    points: result.data?.[0]?.points,
    error: result.error?.message,
    isPending: result.isPending,
    isFetching: result.isFetching,
  }));

/** The safety cap of the data path: whatever a source returns, a series is thinned to about the source limit before it is kept. */
const capReadings = (results: TimeSeriesData[]): TimeSeriesData[] =>
  results.map((result) => ({
    ...result,
    points: [...thinPoints(result.points, CHART_MAX_SOURCE_POINTS)],
  }));

const definitionKey = (scopeKey: string, seriesId: string) => [
  QUERY_ROOT,
  CHART_QUERY_SEGMENT,
  scopeKey,
  'definition',
  seriesId,
];
const readingsKey = (scopeKey: string, seriesId: string) => [
  QUERY_ROOT,
  CHART_QUERY_SEGMENT,
  scopeKey,
  'readings',
  seriesId,
];

/**
 * The readings a series loaded last, for whatever window. `useQueries` starts a new observer when the window changes the key, so
 * `keepPreviousData` has nothing to keep there; the cache still holds the earlier windows, and the plot shows the newest of them
 * until the readings of the new window arrive.
 */
const lastLoadedReadings = (
  queryClient: QueryClient,
  scopeKey: string,
  seriesId: string,
): TimeSeriesData[] | undefined => {
  let latest: { data: TimeSeriesData[]; updatedAt: number } | undefined;
  for (const [key, data] of queryClient.getQueriesData<TimeSeriesData[]>({
    queryKey: readingsKey(scopeKey, seriesId),
  })) {
    if (data === undefined) continue;
    const updatedAt = queryClient.getQueryState(key)?.dataUpdatedAt ?? 0;
    if (latest === undefined || updatedAt >= latest.updatedAt) latest = { data, updatedAt };
  }
  return latest?.data;
};

export function useChartModel({
  configuration,
  nowMs,
  liveAppended,
  isLive,
}: UseChartModelInput): ChartModel {
  const adapter = useChartAdapter();
  const scopeKey = useChartScopeKey();

  // The page parses its state afresh on every change, so a toggle hands down new but equal series; only a real change rebuilds the views.
  const configuredSeries = useStableValue(configuration.series);
  const seriesIds = useMemo(
    () => configuredSeries.map((entry) => entry.seriesId),
    [configuredSeries],
  );
  const customStart = configuration.window?.start;
  const customEnd = configuration.window?.end;
  const baseWindow = useMemo(() => {
    const custom =
      customStart !== undefined && customEnd !== undefined
        ? { fromMs: customStart, toMs: customEnd }
        : undefined;
    const resolved = resolveChartWindow(configuration.range, nowMs, custom);
    return { start: resolved.fromMs, end: resolved.toMs };
  }, [configuration.range, customStart, customEnd, nowMs]);

  const queryClient = useQueryClient();
  const definitionStates = useQueries({
    queries: seriesIds.map((seriesId) => ({
      queryKey: definitionKey(scopeKey, seriesId),
      queryFn: () => adapter.getSeriesDetails(seriesId).then((definition) => definition ?? null),
    })),
    combine: combineDefinitions,
  });
  const readingStates = useQueries({
    queries: seriesIds.map((seriesId) => ({
      queryKey: [...readingsKey(scopeKey, seriesId), baseWindow.start, baseWindow.end],
      queryFn: () => adapter.getSeriesData([seriesId], baseWindow).then(capReadings),
      placeholderData: () => lastLoadedReadings(queryClient, scopeKey, seriesId),
    })),
    combine: combineReadings,
  });
  const thresholdQuery = useQuery({
    queryKey: [QUERY_ROOT, CHART_QUERY_SEGMENT, scopeKey, 'thresholds', seriesIds],
    queryFn: () => adapter.getThresholds(seriesIds),
    enabled: seriesIds.length > 0,
  });
  const isEventsOn = configuration.overlays.includes(ChartOverlay.EVENT_MARKERS);
  const eventQuery = useQuery({
    queryKey: [
      QUERY_ROOT,
      CHART_QUERY_SEGMENT,
      scopeKey,
      'events',
      baseWindow.start,
      baseWindow.end,
    ],
    queryFn: () => adapter.getEvents(baseWindow),
    enabled: isEventsOn,
    placeholderData: keepPreviousData,
  });
  const isAlertingOpen = configuration.panel === ChartPanel.ALERTING;
  const alertQuery = useQuery({
    queryKey: [
      QUERY_ROOT,
      CHART_QUERY_SEGMENT,
      scopeKey,
      'alerts',
      seriesIds,
      baseWindow.start,
      baseWindow.end,
    ],
    queryFn: () => adapter.getAlerts(seriesIds, baseWindow),
    enabled: isAlertingOpen && seriesIds.length > 0,
  });

  const latestLiveAt = useMemo(
    () =>
      Object.values(liveAppended).reduce(
        (latest, points) => Math.max(latest, points[points.length - 1]?.timestamp ?? 0),
        0,
      ),
    [liveAppended],
  );
  const window = useMemo<ChartTimeRange>(() => {
    if (!isLive || latestLiveAt <= baseWindow.end) return baseWindow;
    const span = baseWindow.end - baseWindow.start;
    return { start: latestLiveAt - span, end: latestLiveAt };
  }, [isLive, latestLiveAt, baseWindow]);
  const bounds = useMemo<ChartTimeRange>(
    () => ({
      start: nowMs - CHART_ALL_HISTORY_DAYS * MILLISECONDS_PER_DAY,
      end: Math.max(nowMs, latestLiveAt),
    }),
    [nowMs, latestLiveAt],
  );

  const loadedPoints = useMemo<Record<string, readonly TimeSeriesPoint[]>>(
    () =>
      Object.fromEntries(
        configuredSeries.map((entry, index) => [
          entry.seriesId,
          readingStates[index]?.points ?? EMPTY_POINTS,
        ]),
      ),
    [configuredSeries, readingStates],
  );
  const views = useMemo<ChartSeriesView[]>(
    () =>
      configuredSeries.map((entry, index) => {
        const definitionState = definitionStates[index];
        const readingState = readingStates[index];
        const definition: TimeSeriesDefinition = definitionState?.definition ?? {
          id: entry.seriesId,
          name: entry.seriesId,
          tag: '',
          description: '',
          sourceName: '',
          isSimulated: false,
        };
        const loaded = loadedPoints[entry.seriesId] ?? EMPTY_POINTS;
        const merged = [...loaded, ...(liveAppended[entry.seriesId] ?? EMPTY_POINTS)];
        const ownUnit = definition.unit;
        const unit = entry.displayUnit ?? ownUnit ?? '';
        const points = convertPoints(merged, ownUnit, entry.displayUnit ?? ownUnit);
        const hasError = Boolean(readingState?.error) || Boolean(definitionState?.error);
        const thresholds = convertThresholds(
          (thresholdQuery.data ?? []).filter((threshold) => threshold.seriesId === entry.seriesId),
          ownUnit,
          entry.displayUnit ?? ownUnit,
        );
        return {
          definition,
          configuration: entry,
          index,
          status: deriveSeriesStatus({
            isLoading: Boolean(readingState?.isPending) || Boolean(definitionState?.isPending),
            hasError,
            points,
            nowMs: Math.max(nowMs, latestLiveAt),
          }),
          errorMessage: readingState?.error ?? definitionState?.error,
          unit,
          points,
          statistics: computeStatistics(points, window),
          thresholds,
        };
      }),
    [
      configuredSeries,
      definitionStates,
      readingStates,
      loadedPoints,
      thresholdQuery.data,
      liveAppended,
      nowMs,
      latestLiveAt,
      window,
    ],
  );
  const visibleViews = useMemo(
    () =>
      views.filter(
        (view) => view.configuration.isVisible && view.status !== SeriesDataStatus.ERROR,
      ),
    [views],
  );

  const isProfilingOpen = configuration.panel === ChartPanel.DATA_PROFILING;
  const profiles = useMemo(
    () =>
      isProfilingOpen
        ? views.map((view) =>
            profileSeries(view.definition.id, view.points, window, Math.max(nowMs, latestLiveAt)),
          )
        : [],
    [isProfilingOpen, views, window, nowMs, latestLiveAt],
  );
  const isMonitoringOpen = configuration.panel === ChartPanel.MONITORING;
  const snapshots = useMemo(
    () =>
      isMonitoringOpen
        ? buildMonitoringSnapshots(views, Math.max(nowMs, latestLiveAt), isLive)
        : [],
    [isMonitoringOpen, views, nowMs, latestLiveAt, isLive],
  );

  const retrySeries = (seriesId: string): void => {
    void queryClient.refetchQueries({ queryKey: definitionKey(scopeKey, seriesId) });
    void queryClient.refetchQueries({ queryKey: readingsKey(scopeKey, seriesId) });
  };

  return {
    window,
    bounds,
    views,
    loadedPoints,
    visibleViews,
    events: isEventsOn ? (eventQuery.data ?? []) : [],
    alerts: {
      data: alertQuery.data ?? [],
      isLoading: alertQuery.isLoading,
      error: alertQuery.error ?? undefined,
      refetch: () => void alertQuery.refetch(),
    },
    profiles,
    snapshots,
    isRefreshing: readingStates.some((state) => state.isFetching && !state.isPending),
    retrySeries,
  };
}
