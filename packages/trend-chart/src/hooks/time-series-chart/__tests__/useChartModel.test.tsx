import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MILLISECONDS_PER_DAY } from '../../../constants/formats';
import { CHART_ALL_HISTORY_DAYS, MILLISECONDS_PER_MINUTE } from '../../../constants/monitoring';
import { CHART_MAX_SOURCE_POINTS } from '../../../constants/timeSeriesChart';
import { ChartRange } from '../../../enums/monitoring';
import {
  AlertSeverity,
  AlertStatus,
  ChartOverlay,
  ChartPanel,
  SeriesDataStatus,
  ThresholdLevel,
  ThresholdSide,
  ThresholdSource,
} from '../../../enums/timeSeriesChart';
import {
  createChartConfiguration,
  setDisplayUnit,
  setSeriesVisible,
  togglePanel,
} from '../../../lib/time-series-chart/configuration';
import {
  createChartAdapter,
  createDefinition,
  createPoint,
  createPoints,
  createThreshold,
} from '../../../mocks/chartData';
import { createChartWrapper, createDeferred } from '../../../mocks/ChartWrapper';
import type {
  ChartAlert,
  ChartConfiguration,
  ChartDataAdapter,
  ChartEvent,
  TimeSeriesData,
  TimeSeriesPoint,
} from '../../../types/timeSeriesChart';
import { useChartModel } from '../useChartModel';

const SECOND_SERIES_ID = 's2';

type ModelInput = Parameters<typeof useChartModel>[0];

const MINUTE_MS = MILLISECONDS_PER_MINUTE;
const SECOND_MS = 1000;
const NOW_MS = Date.UTC(2026, 9, 1, 8, 0);
const LAST_HOUR = { start: NOW_MS - 60 * MINUTE_MS, end: NOW_MS };
/** Three readings a minute apart, the last one now. */
const READINGS = createPoints([4, 6, 8], NOW_MS - 2 * MINUTE_MS);
const NO_LIVE_READINGS: Readonly<Record<string, readonly TimeSeriesPoint[]>> = {};
const EVENT: ChartEvent = {
  id: 'e1',
  kind: 'ALARM',
  at: NOW_MS - 5 * MINUTE_MS,
  label: 'High pressure',
};
const ALERT: ChartAlert = {
  id: 'a1',
  seriesId: 's1',
  severity: AlertSeverity.DANGER,
  status: AlertStatus.ACTIVE,
  at: NOW_MS - 5 * MINUTE_MS,
  message: 'Pressure above the danger limit',
};

describe(useChartModel.name, () => {
  it('shows a series as loading until its readings arrive', () => {
    const pending = createDeferred<TimeSeriesData[]>();
    const { result } = renderModel(sourceAdapter({ getSeriesData: () => pending.promise }));

    expect(result.current.views[0]).toMatchObject({ status: SeriesDataStatus.LOADING, points: [] });
  });

  it('resolves a series from its definition and its readings', async () => {
    const { result } = renderModel(sourceAdapter());

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views[0]).toMatchObject({
      definition: createDefinition({ id: 's1' }),
      index: 0,
      unit: 'bar',
      points: READINGS,
      statistics: { min: 4, max: 8, mean: 6, count: 3 },
      thresholds: [],
      errorMessage: undefined,
    });
  });

  it('asks the data source for the readings of the window', async () => {
    const getSeriesData = vi.fn<ChartDataAdapter['getSeriesData']>(async () => [
      { seriesId: 's1', points: READINGS },
    ]);
    const { result } = renderModel(sourceAdapter({ getSeriesData }));

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(getSeriesData).toHaveBeenCalledWith(['s1'], LAST_HOUR);
  });

  it('takes the window from the range, ending now', () => {
    const { result } = renderModel(sourceAdapter());

    expect(result.current.window).toEqual(LAST_HOUR);
  });

  it('takes the window of a custom range as it is', () => {
    const window = { start: NOW_MS - 10 * MINUTE_MS, end: NOW_MS - 5 * MINUTE_MS };
    const configuration = createChartConfiguration(['s1'], { range: ChartRange.CUSTOM, window });

    const { result } = renderModel(sourceAdapter(), { configuration });

    expect(result.current.window).toEqual(window);
  });

  it('lets the chart be moved over all of history, up to now', () => {
    const { result } = renderModel(sourceAdapter());

    expect(result.current.bounds).toEqual({
      start: NOW_MS - CHART_ALL_HISTORY_DAYS * MILLISECONDS_PER_DAY,
      end: NOW_MS,
    });
  });

  it('counts only the readings inside the window in the statistics', async () => {
    const earlier = createPoint(LAST_HOUR.start - MINUTE_MS, 100);
    const getSeriesData = async () => [{ seriesId: 's1', points: [earlier, ...READINGS] }];
    const { result } = renderModel(sourceAdapter({ getSeriesData }));

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views[0]?.statistics).toEqual({ min: 4, max: 8, mean: 6, count: 3 });
  });

  it('shows a series as failed, with the reason, when its readings cannot be loaded', async () => {
    const getSeriesData = async () => Promise.reject(new Error('The source is down'));
    const { result } = renderModel(sourceAdapter({ getSeriesData }));

    await waitForStatus(result, SeriesDataStatus.ERROR);

    expect(result.current.views[0]?.errorMessage).toBe('The source is down');
  });

  it('shows a series as failed when its definition cannot be loaded', async () => {
    const getSeriesDetails = async () => Promise.reject(new Error('Not allowed'));
    const { result } = renderModel(sourceAdapter({ getSeriesDetails }));

    await waitForStatus(result, SeriesDataStatus.ERROR);

    expect(result.current.views[0]?.errorMessage).toBe('Not allowed');
  });

  it('leaves a failed series out of what is drawn', async () => {
    const getSeriesData = async () => Promise.reject(new Error('The source is down'));
    const { result } = renderModel(sourceAdapter({ getSeriesData }));

    await waitForStatus(result, SeriesDataStatus.ERROR);

    expect(result.current.visibleViews).toEqual([]);
  });

  it('leaves a hidden series out of what is drawn but keeps it in the list', async () => {
    const configuration = setSeriesVisible(hourChart(['s1', 's2']), 's1', false);
    const { result } = renderModel(sourceAdapter(), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views.map((view) => view.definition.id)).toEqual(['s1', 's2']);
    expect(result.current.visibleViews.map((view) => view.definition.id)).toEqual(['s2']);
  });

  it('shows a series without a reading as having no data', async () => {
    const { result } = renderModel(
      sourceAdapter({ getSeriesData: async () => [{ seriesId: 's1', points: [] }] }),
    );

    await waitForStatus(result, SeriesDataStatus.NO_DATA);

    expect(result.current.views[0]?.statistics.count).toBe(0);
  });

  it('shows a series as stale when its latest reading is old', async () => {
    const old = createPoints([4, 6, 8], NOW_MS - 50 * MINUTE_MS);
    const { result } = renderModel(
      sourceAdapter({ getSeriesData: async () => [{ seriesId: 's1', points: old }] }),
    );

    await waitForStatus(result, SeriesDataStatus.STALE);

    expect(result.current.views[0]?.points).toEqual(old);
  });

  it('names a series the data source does not know by its id, with no unit', async () => {
    const { result } = renderModel(sourceAdapter({ getSeriesDetails: async () => undefined }));

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views[0]).toMatchObject({
      definition: {
        id: 's1',
        name: 's1',
        tag: '',
        description: '',
        sourceName: '',
        isSimulated: false,
      },
      unit: '',
    });
  });

  it('converts the readings to the display unit of the series', async () => {
    const configuration = setDisplayUnit(hourChart(), 's1', 'bar', 'kPa').configuration;
    const { result } = renderModel(sourceAdapter(), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views[0]?.unit).toBe('kPa');
    expect(result.current.views[0]?.points.map((point) => point.value)).toEqual([
      expect.closeTo(400, 6),
      expect.closeTo(600, 6),
      expect.closeTo(800, 6),
    ]);
  });

  it('keeps the loaded readings in the own unit of the series', async () => {
    const configuration = setDisplayUnit(hourChart(), 's1', 'bar', 'kPa').configuration;
    const { result } = renderModel(sourceAdapter(), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.loadedPoints).toEqual({ s1: READINGS });
  });

  it('gives each series its own thresholds', async () => {
    const own = createThreshold({ seriesId: 's1', value: 7 });
    const other = createThreshold({ seriesId: 's2', value: 9 });
    const getThresholds = vi.fn<ChartDataAdapter['getThresholds']>(async () => [own, other]);
    const { result } = renderModel(sourceAdapter({ getThresholds }), {
      configuration: hourChart(['s1', 's2']),
    });

    await waitFor(() => expect(result.current.views[0]?.thresholds).toEqual([own]));

    expect(result.current.views[1]?.thresholds).toEqual([other]);
    expect(getThresholds).toHaveBeenCalledWith(['s1', 's2']);
  });

  it('converts the thresholds to the display unit of the series', async () => {
    const configuration = setDisplayUnit(hourChart(), 's1', 'bar', 'kPa').configuration;
    const getThresholds = async () => [createThreshold({ seriesId: 's1', value: 7 })];
    const { result } = renderModel(sourceAdapter({ getThresholds }), { configuration });

    await waitFor(() => expect(result.current.views[0]?.thresholds).toHaveLength(1));

    expect(result.current.views[0]?.thresholds[0]).toMatchObject({
      value: expect.closeTo(700, 6),
      unit: 'kPa',
    });
  });

  it('lists a threshold the user added after those of the data source, marked as configured', async () => {
    const fromSource = createThreshold({ seriesId: 's1', value: 7 });
    const configuration = {
      ...hourChart(),
      thresholds: [
        {
          seriesId: 's1',
          level: ThresholdLevel.DANGER,
          side: ThresholdSide.UPPER,
          value: 9,
          unit: 'bar',
        },
      ],
    };
    const { result } = renderModel(sourceAdapter({ getThresholds: async () => [fromSource] }), {
      configuration,
    });

    await waitFor(() => expect(result.current.views[0]?.thresholds).toHaveLength(2));

    expect(result.current.views[0]?.thresholds[1]).toMatchObject({
      seriesId: 's1',
      level: ThresholdLevel.DANGER,
      value: 9,
      unit: 'bar',
      source: ThresholdSource.CONFIGURED,
    });
  });

  it('converts an added threshold from the unit it was entered in to the display unit', async () => {
    const withUnit = setDisplayUnit(hourChart(), 's1', 'bar', 'kPa').configuration;
    const configuration = {
      ...withUnit,
      thresholds: [
        {
          seriesId: 's1',
          level: ThresholdLevel.ALERT,
          side: ThresholdSide.UPPER,
          value: 2,
          unit: 'bar',
        },
      ],
    };
    const { result } = renderModel(sourceAdapter({ getThresholds: async () => [] }), {
      configuration,
    });

    await waitFor(() => expect(result.current.views[0]?.thresholds).toHaveLength(1));

    expect(result.current.views[0]?.thresholds[0]).toMatchObject({
      value: expect.closeTo(200, 6),
      unit: 'kPa',
    });
  });

  it('asks for no thresholds while the chart has no series', async () => {
    const getThresholds = vi.fn<ChartDataAdapter['getThresholds']>(async () => []);
    const getEvents = vi.fn<ChartDataAdapter['getEvents']>(async () => []);
    const { result } = renderModel(sourceAdapter({ getThresholds, getEvents }), {
      configuration: hourChart([]),
    });

    await waitFor(() => expect(getEvents).toHaveBeenCalled());

    expect(getThresholds).not.toHaveBeenCalled();
    expect(result.current.views).toEqual([]);
  });

  it('loads the events of the window while the event markers are on', async () => {
    const getEvents = vi.fn<ChartDataAdapter['getEvents']>(async () => [EVENT]);
    const { result } = renderModel(sourceAdapter({ getEvents }));

    await waitFor(() => expect(result.current.events).toEqual([EVENT]));

    expect(getEvents).toHaveBeenCalledWith(LAST_HOUR);
  });

  it('asks for no events while the event markers are off', async () => {
    const getEvents = vi.fn<ChartDataAdapter['getEvents']>(async () => [EVENT]);
    const configuration = createChartConfiguration(['s1'], {
      range: ChartRange.ONE_HOUR,
      overlays: [ChartOverlay.THRESHOLDS],
    });
    const { result } = renderModel(sourceAdapter({ getEvents }), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(getEvents).not.toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('loads the alerts of the series and the window while the Alerting panel is open', async () => {
    const getAlerts = vi.fn<ChartDataAdapter['getAlerts']>(async () => [ALERT]);
    const configuration = togglePanel(hourChart(), ChartPanel.ALERTING);
    const { result } = renderModel(sourceAdapter({ getAlerts }), { configuration });

    await waitFor(() => expect(result.current.alerts.data).toEqual([ALERT]));

    expect(getAlerts).toHaveBeenCalledWith(['s1'], LAST_HOUR);
  });

  it('asks for no alerts while the Alerting panel is closed', async () => {
    const getAlerts = vi.fn<ChartDataAdapter['getAlerts']>(async () => [ALERT]);
    const { result } = renderModel(sourceAdapter({ getAlerts }));

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(getAlerts).not.toHaveBeenCalled();
    expect(result.current.alerts).toMatchObject({ data: [], isLoading: false, error: undefined });
  });

  it('gives the error when the alerts cannot be loaded', async () => {
    const getAlerts = async () => Promise.reject(new Error('Alerts are unavailable'));
    const configuration = togglePanel(hourChart(), ChartPanel.ALERTING);
    const { result } = renderModel(sourceAdapter({ getAlerts }), { configuration });

    await waitFor(() =>
      expect(result.current.alerts.error?.message).toBe('Alerts are unavailable'),
    );

    expect(result.current.alerts.data).toEqual([]);
  });

  it('asks for the alerts again on a retry', async () => {
    const getAlerts = vi.fn<ChartDataAdapter['getAlerts']>(async () => [ALERT]);
    const configuration = togglePanel(hourChart(), ChartPanel.ALERTING);
    const { result } = renderModel(sourceAdapter({ getAlerts }), { configuration });
    await waitFor(() => expect(result.current.alerts.data).toEqual([ALERT]));

    act(() => result.current.alerts.refetch());

    await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(2));
  });

  it('profiles the series while the Data profiling panel is open', async () => {
    const configuration = togglePanel(hourChart(), ChartPanel.DATA_PROFILING);
    const { result } = renderModel(sourceAdapter(), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0]).toMatchObject({
      seriesId: 's1',
      validCount: 3,
      latestAt: NOW_MS,
    });
  });

  it('reads the latest value of each series while the Monitoring panel is open', async () => {
    const configuration = togglePanel(hourChart(), ChartPanel.MONITORING);
    const { result } = renderModel(sourceAdapter(), { configuration });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.snapshots).toEqual([
      {
        seriesId: 's1',
        latestValue: 8,
        latestAt: NOW_MS,
        ageMs: 0,
        status: SeriesDataStatus.OK,
        isSimulated: false,
      },
    ]);
  });

  it('builds no profiles and no snapshots while their panels are closed', async () => {
    const { result } = renderModel(sourceAdapter());

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.profiles).toEqual([]);
    expect(result.current.snapshots).toEqual([]);
  });

  it('adds what the live feed appended after the loaded readings', async () => {
    const appended = createPoint(NOW_MS + MINUTE_MS, 9);
    const { result } = renderModel(sourceAdapter(), {
      liveAppended: { s1: [appended] },
      isLive: true,
    });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.views[0]?.points).toEqual([...READINGS, appended]);
    expect(result.current.loadedPoints).toEqual({ s1: READINGS });
  });

  it('slides the window to keep the newest live reading in view', () => {
    const liveAppended = { s1: [createPoint(NOW_MS + MINUTE_MS, 9)] };

    const { result } = renderModel(sourceAdapter(), { liveAppended, isLive: true });

    expect(result.current.window).toEqual({
      start: LAST_HOUR.start + MINUTE_MS,
      end: NOW_MS + MINUTE_MS,
    });
    expect(result.current.bounds.end).toBe(NOW_MS + MINUTE_MS);
  });

  it('keeps the window where it is while the chart is not live', () => {
    const liveAppended = { s1: [createPoint(NOW_MS + MINUTE_MS, 9)] };

    const { result } = renderModel(sourceAdapter(), { liveAppended, isLive: false });

    expect(result.current.window).toEqual(LAST_HOUR);
  });

  it('marks every monitored series as simulated while the chart is live', async () => {
    const configuration = togglePanel(hourChart(), ChartPanel.MONITORING);
    const { result } = renderModel(sourceAdapter(), { configuration, isLive: true });

    await waitForStatus(result, SeriesDataStatus.OK);

    expect(result.current.snapshots[0]?.isSimulated).toBe(true);
  });

  it('thins a series that comes with more readings than the chart keeps', async () => {
    const sent = CHART_MAX_SOURCE_POINTS + 2000;
    const values = Array.from({ length: sent }, (_unused, index) => index % 7);
    const many = createPoints(values, NOW_MS - sent * SECOND_MS, SECOND_MS);
    const { result } = renderModel(
      sourceAdapter({ getSeriesData: async () => [{ seriesId: 's1', points: many }] }),
    );

    await waitFor(() => expect(result.current.loadedPoints.s1?.length).toBeGreaterThan(0));

    expect(result.current.loadedPoints.s1?.length).toBeLessThanOrEqual(CHART_MAX_SOURCE_POINTS + 2);
  });

  it('keeps the earlier readings on screen while those of a new window load', async () => {
    const later = createDeferred<TimeSeriesData[]>();
    const { result, rerender } = renderModel(
      sourceAdapter({ getSeriesData: readingsUntilNow(later.promise) }),
    );
    await waitForStatus(result, SeriesDataStatus.OK);

    rerender(modelInput({ nowMs: NOW_MS + MINUTE_MS }));

    expect(result.current.views[0]).toMatchObject({
      status: SeriesDataStatus.OK,
      points: READINGS,
    });
    expect(result.current.loadedPoints).toEqual({ s1: READINGS });
  });

  it('says that it is refreshing while the readings of a new window load', async () => {
    const later = createDeferred<TimeSeriesData[]>();
    const { result, rerender } = renderModel(
      sourceAdapter({ getSeriesData: readingsUntilNow(later.promise) }),
    );
    await waitForStatus(result, SeriesDataStatus.OK);

    rerender(modelInput({ nowMs: NOW_MS + MINUTE_MS }));

    expect(result.current.isRefreshing).toBe(true);
  });

  it('shows the readings of the new window, no longer refreshing, once they arrive', async () => {
    const later = createDeferred<TimeSeriesData[]>();
    const newer = createPoints([5, 7, 9], NOW_MS - MINUTE_MS);
    const { result, rerender } = renderModel(
      sourceAdapter({ getSeriesData: readingsUntilNow(later.promise) }),
    );
    await waitForStatus(result, SeriesDataStatus.OK);
    rerender(modelInput({ nowMs: NOW_MS + MINUTE_MS }));

    later.resolve([{ seriesId: 's1', points: newer }]);

    await waitFor(() => expect(result.current.views[0]?.points).toEqual(newer));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('keeps for each series its own earlier readings', async () => {
    const later = createDeferred<TimeSeriesData[]>();
    const flowReadings = createPoints([100, 120], NOW_MS - MINUTE_MS);
    const getSeriesData = vi.fn<ChartDataAdapter['getSeriesData']>(([seriesId = ''], range) =>
      range.end === NOW_MS
        ? Promise.resolve([
            { seriesId, points: seriesId === SECOND_SERIES_ID ? flowReadings : READINGS },
          ])
        : later.promise,
    );
    const configuration = hourChart(['s1', 's2']);
    const { result, rerender } = renderModel(sourceAdapter({ getSeriesData }), { configuration });
    await waitForStatus(result, SeriesDataStatus.OK);

    rerender(modelInput({ configuration, nowMs: NOW_MS + MINUTE_MS }));

    expect(result.current.views.map((view) => view.points)).toEqual([READINGS, flowReadings]);
  });

  it('keeps the readings it loaded last when the window has changed more than once', async () => {
    const later = createDeferred<TimeSeriesData[]>();
    const second = createPoints([5, 7, 9], NOW_MS - MINUTE_MS);
    const getSeriesData = vi.fn<ChartDataAdapter['getSeriesData']>((_seriesIds, range) => {
      if (range.end === NOW_MS) return Promise.resolve([{ seriesId: 's1', points: READINGS }]);
      if (range.end === NOW_MS + MINUTE_MS)
        return Promise.resolve([{ seriesId: 's1', points: second }]);
      return later.promise;
    });
    const { result, rerender } = renderModel(sourceAdapter({ getSeriesData }));
    await waitForStatus(result, SeriesDataStatus.OK);
    rerender(modelInput({ nowMs: NOW_MS + MINUTE_MS }));
    await waitFor(() => expect(result.current.loadedPoints).toEqual({ s1: second }));

    rerender(modelInput({ nowMs: NOW_MS + 2 * MINUTE_MS }));

    expect(result.current.loadedPoints).toEqual({ s1: second });
  });

  it('shows a series as failed when the readings of a new window cannot be loaded', async () => {
    const getSeriesData = vi.fn<ChartDataAdapter['getSeriesData']>((_seriesIds, range) =>
      range.end === NOW_MS
        ? Promise.resolve([{ seriesId: 's1', points: READINGS }])
        : Promise.reject(new Error('The source is down')),
    );
    const { result, rerender } = renderModel(sourceAdapter({ getSeriesData }));
    await waitForStatus(result, SeriesDataStatus.OK);

    rerender(modelInput({ nowMs: NOW_MS + MINUTE_MS }));

    await waitForStatus(result, SeriesDataStatus.ERROR);
    expect(result.current.views[0]?.errorMessage).toBe('The source is down');
  });

  it('is not refreshing during the first load', () => {
    const pending = createDeferred<TimeSeriesData[]>();
    const { result } = renderModel(sourceAdapter({ getSeriesData: () => pending.promise }));

    expect(result.current.isRefreshing).toBe(false);
  });

  it('asks the data source for a series again on a retry', async () => {
    const getSeriesDetails = vi.fn<ChartDataAdapter['getSeriesDetails']>(async (seriesId) =>
      createDefinition({ id: seriesId }),
    );
    const getSeriesData = vi.fn<ChartDataAdapter['getSeriesData']>(async () => [
      { seriesId: 's1', points: READINGS },
    ]);
    const { result } = renderModel(sourceAdapter({ getSeriesDetails, getSeriesData }));
    await waitForStatus(result, SeriesDataStatus.OK);

    act(() => result.current.retrySeries('s1'));

    await waitFor(() => expect(getSeriesData).toHaveBeenCalledTimes(2));
    expect(getSeriesDetails).toHaveBeenCalledTimes(2);
  });

  it('recovers a failed series when a retry succeeds', async () => {
    const getSeriesData = vi
      .fn<ChartDataAdapter['getSeriesData']>()
      .mockRejectedValueOnce(new Error('The source is down'))
      .mockResolvedValue([{ seriesId: 's1', points: READINGS }]);
    const { result } = renderModel(sourceAdapter({ getSeriesData }));
    await waitForStatus(result, SeriesDataStatus.ERROR);

    act(() => result.current.retrySeries('s1'));

    await waitForStatus(result, SeriesDataStatus.OK);
    expect(result.current.visibleViews).toHaveLength(1);
  });
});

/** A data source that knows every series it is asked about and has the same three readings for each. */
function sourceAdapter(overrides: Partial<ChartDataAdapter> = {}): ChartDataAdapter {
  return createChartAdapter({
    getSeriesDetails: async (seriesId) => createDefinition({ id: seriesId }),
    getSeriesData: async (seriesIds) =>
      seriesIds.map((seriesId) => ({ seriesId, points: READINGS })),
    ...overrides,
  });
}

/** The same three readings for the window that ends now, and what the test hands over for any later window. */
function readingsUntilNow(later: Promise<TimeSeriesData[]>): ChartDataAdapter['getSeriesData'] {
  return (_seriesIds, range) =>
    range.end === NOW_MS ? Promise.resolve([{ seriesId: 's1', points: READINGS }]) : later;
}

function hourChart(seriesIds: string[] = ['s1']): ChartConfiguration {
  return createChartConfiguration(seriesIds, { range: ChartRange.ONE_HOUR });
}

const DEFAULT_CONFIGURATION = hourChart();

function modelInput(overrides: Partial<ModelInput> = {}): ModelInput {
  return {
    configuration: DEFAULT_CONFIGURATION,
    nowMs: NOW_MS,
    liveAppended: NO_LIVE_READINGS,
    isLive: false,
    ...overrides,
  };
}

function renderModel(adapter: ChartDataAdapter, overrides: Partial<ModelInput> = {}) {
  return renderHook((input: ModelInput) => useChartModel(input), {
    wrapper: createChartWrapper(adapter),
    initialProps: modelInput(overrides),
  });
}

/** Waits until every series of the chart has the status. */
async function waitForStatus(
  result: { current: ReturnType<typeof useChartModel> },
  status: SeriesDataStatus,
): Promise<void> {
  await waitFor(() => {
    expect(result.current.views.length).toBeGreaterThan(0);
    expect(result.current.views.every((view) => view.status === status)).toBe(true);
  });
}
