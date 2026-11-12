import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Separator } from '@cognite/aura/components/separator';
import { toast } from '@cognite/aura/components/sonner-toast';
import {
  IconX,
  IconArrowAutofitHeight,
  IconChartLine,
  IconEyeOff,
  IconPlus,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { HALF } from '../../constants/mathConstants';
import {
  ASSISTANT_PANEL_LABEL,
  CHART_MAX_SERIES,
  CHART_WORKSPACE_PLOT_HEIGHT_PX,
} from '../../constants/timeSeriesChart';
import { ChartMode, ChartRange } from '../../enums/monitoring';
import { StateSize } from '../../enums/stateSize';
import { StateVariant } from '../../enums/stateVariant';
import { ChartOverlay, ChartPanel, SeriesDataStatus } from '../../enums/timeSeriesChart';
import { useChartModel } from '../../hooks/time-series-chart/useChartModel';
import { useLiveFeed } from '../../hooks/time-series-chart/useLiveFeed';
import { buildExportFileName } from '../../lib/csv';
import { formatDateTime, formatShortDateTime } from '../../lib/format';
import { exportChartImage } from '../../lib/monitoring/chartExport';
import {
  addSeries,
  moveSeries,
  removeSeries,
  setDisplayUnit,
  setSeriesStyle,
  setSeriesVisible,
  setTitle,
  setWindow,
  showAllSeries,
  showOnlySeries,
  toggleOverlay,
  togglePanel,
} from '../../lib/time-series-chart/configuration';
import { profileSeries } from '../../lib/time-series-chart/dataQuality';
import type {
  ChartAlert,
  ChartConfiguration,
  ChartEvent,
  ChartTimeRange,
  SeriesStyle,
  TimeSeriesPoint,
} from '../../types/timeSeriesChart';
import { StateMessage } from '../general/StateMessage';

import { ChartActions } from './ChartActions';
import { ChartHeader } from './ChartHeader';
import { ChartRail } from './ChartRail';
import { ChartToolbar } from './ChartToolbar';
import { AddDataPanel } from './panels/AddDataPanel';
import { AlertingPanel } from './panels/AlertingPanel';
import { AxesPanel } from './panels/AxesPanel';
import { ChartSidebarSlot } from './panels/ChartSidebarSlot';
import { DataProfilingPanel } from './panels/DataProfilingPanel';
import { DisplayPanel } from './panels/DisplayPanel';
import { LayersPanel } from './panels/LayersPanel';
import { MonitoringPanel } from './panels/MonitoringPanel';
import { SeriesInfoPanel } from './panels/SeriesInfoPanel';
import { ThresholdsPanel } from './panels/ThresholdsPanel';
import { TimeSeriesPlot } from './plot/TimeSeriesPlot';
import { SeriesTable } from './series/SeriesTable';

import '../../chart.css';

const SUMMARY_SERIES_LIMIT = 6;

export interface IndustrialTimeSeriesChartProperties {
  configuration: ChartConfiguration;
  onConfigurationChange: (configuration: ChartConfiguration) => void;
  /** "Now" in milliseconds, from the host's clock. */
  nowMs: number;
  exportName: string;
  onClose?: () => void;
  closeLabel?: string;
  extraActions?: ReactNode;
  onEventSelect?: (event: ChartEvent) => void;
  isLiveDisabled?: boolean;
  /** The body of an Assistant panel; the chart shows the panel's rail button only when this is given. */
  assistantPanel?: ReactNode;
  /** The name of the assistant panel on the rail and in the sidebar; "Assistant" when not given. */
  assistantLabel?: string;
}

export function IndustrialTimeSeriesChart({
  configuration,
  onConfigurationChange,
  nowMs,
  exportName,
  onClose,
  closeLabel = 'Back to the signals',
  extraActions,
  onEventSelect,
  isLiveDisabled = false,
  assistantPanel,
  assistantLabel = ASSISTANT_PANEL_LABEL,
}: IndustrialTimeSeriesChartProperties) {
  const svgReference = useRef<SVGSVGElement>(null);
  const loadedPointsReference = useRef<Readonly<Record<string, readonly TimeSeriesPoint[]>>>({});
  const [panelSeriesId, setPanelSeriesId] = useState<string | undefined>();
  const [isInterpolated, setIsInterpolated] = useState(false);

  const feed = useLiveFeed({
    isEnabled: configuration.isLive && !isLiveDisabled,
    basePointsReference: loadedPointsReference,
  });
  const model = useChartModel({
    configuration,
    nowMs,
    liveAppended: feed.appended,
    isLive: configuration.isLive,
  });

  const { window: chartWindow, views, visibleViews } = model;
  const { loadedPoints } = model;
  useEffect(() => {
    loadedPointsReference.current = loadedPoints;
  }, [loadedPoints]);
  const periodLabel = `${formatDateTime(new Date(chartWindow.start).toISOString())} to ${formatDateTime(new Date(chartWindow.end).toISOString())}`;
  const failedViews = views.filter((view) => view.errorMessage !== undefined);
  const panelView =
    views.find((view) => view.definition.id === panelSeriesId) ??
    (configuration.panel === ChartPanel.SERIES_INFO ? views[0] : undefined);
  const panelProfile = useMemo(
    () =>
      panelView && configuration.panel === ChartPanel.SERIES_INFO
        ? profileSeries(
            panelView.definition.id,
            panelView.points,
            chartWindow,
            Math.max(nowMs, chartWindow.end),
          )
        : undefined,
    [panelView, configuration.panel, chartWindow, nowMs],
  );

  const update = (next: ChartConfiguration): void => onConfigurationChange(next);
  const overlayOn = (overlay: ChartOverlay): boolean => configuration.overlays.includes(overlay);
  const changeWindow = (window: ChartTimeRange): void =>
    update(setWindow(configuration, ChartRange.CUSTOM, window));

  const handleAddSeries = (seriesIds: string[]): void => {
    let next = configuration;
    for (const seriesId of seriesIds) {
      const result = addSeries(next, seriesId);
      if (result.error) {
        toast.error(result.error);
        break;
      }
      next = result.configuration;
    }
    update({ ...next, panel: undefined });
  };
  const handleDisplayUnit = (seriesId: string, displayUnit: string | undefined): void => {
    const view = views.find((candidate) => candidate.definition.id === seriesId);
    const result = setDisplayUnit(configuration, seriesId, view?.definition.unit, displayUnit);
    if (result.error) toast.error(result.error);
    else update(result.configuration);
  };
  const handleLiveToggle = (): void => {
    if (configuration.isLive) feed.stop();
    update({ ...configuration, isLive: !configuration.isLive });
  };
  const togglePanelOf = (panel: ChartPanel): void => update(togglePanel(configuration, panel));
  const handleOpenSeriesPanel = (panel: ChartPanel, seriesId: string): void => {
    const isShown = configuration.panel === panel && panelSeriesId === seriesId;
    setPanelSeriesId(seriesId);
    update({ ...configuration, panel: isShown ? undefined : panel });
  };
  const handleSelectAlert = (alert: ChartAlert): void => {
    const span = chartWindow.end - chartWindow.start;
    const isInside = alert.at >= chartWindow.start && alert.at <= chartWindow.end;
    const moved = isInside
      ? configuration
      : setWindow(configuration, ChartRange.CUSTOM, {
          start: alert.at - span * HALF,
          end: alert.at + span * HALF,
        });
    update({ ...moved, isMarkerMode: true, markerAt: alert.at });
  };
  const handleExportImage = (): void => {
    const svg = svgReference.current;
    if (!svg) {
      toast.error('The chart image could not be created.');
      return;
    }
    exportChartImage(
      svg,
      {
        title: configuration.title,
        scope: exportName,
        period: periodLabel,
        asOf: formatDateTime(new Date(nowMs).toISOString()),
        legend: visibleViews.map((view) => `${view.definition.name} (${view.unit || 'no unit'})`),
      },
      `${buildExportFileName('Time series', exportName, new Date(nowMs)).replace(/\.csv$/, '')}.png`,
      svg.parentElement?.querySelector<SVGSVGElement>('[data-plot-overlay]') ?? undefined,
    ).catch((error: unknown) =>
      toast.error(error instanceof Error ? error.message : 'The chart image could not be created.'),
    );
  };

  const summary = `${configuration.title}: ${visibleViews.length} series from ${periodLabel}. ${visibleViews
    .slice(0, SUMMARY_SERIES_LIMIT)
    .map((view) =>
      `${view.definition.name} from ${view.statistics.min ?? 'no data'} to ${view.statistics.max ?? 'no data'} ${view.unit}`.trim(),
    )
    .join('; ')}.`;

  const renderPanel = (panel: ChartPanel): ReactNode => {
    switch (panel) {
      case ChartPanel.ADD_DATA:
        return (
          <AddDataPanel
            existingIds={configuration.series.map((entry) => entry.seriesId)}
            maxSeries={CHART_MAX_SERIES}
            onAdd={handleAddSeries}
          />
        );
      case ChartPanel.LAYERS:
        return (
          <LayersPanel
            series={views}
            overlays={configuration.overlays}
            onVisibilityChange={(id, isVisible) =>
              update(setSeriesVisible(configuration, id, isVisible))
            }
            onMove={(id, offset) => update(moveSeries(configuration, id, offset))}
            onToggleOverlay={(overlay) => update(toggleOverlay(configuration, overlay))}
          />
        );
      case ChartPanel.DISPLAY:
        return (
          <DisplayPanel
            shouldShowGridlines={configuration.shouldShowGridlines}
            shouldShowMinMax={configuration.shouldShowMinMax}
            isStacked={configuration.mode === ChartMode.STACKED}
            onGridlinesChange={(isOn) => update({ ...configuration, shouldShowGridlines: isOn })}
            onMinMaxChange={(isOn) => update({ ...configuration, shouldShowMinMax: isOn })}
            onStackedChange={(isOn) =>
              update({ ...configuration, mode: isOn ? ChartMode.STACKED : ChartMode.OVERLAID })
            }
          />
        );
      case ChartPanel.AXES:
        return (
          <AxesPanel
            series={visibleViews}
            axes={configuration.axes}
            mode={configuration.mode}
            onAxesChange={(axes) => update({ ...configuration, axes })}
            onModeChange={(mode) => update({ ...configuration, mode })}
          />
        );
      case ChartPanel.ALERTING:
        return (
          <AlertingPanel
            series={views}
            alerts={model.alerts.data}
            isLoading={model.alerts.isLoading}
            error={model.alerts.error}
            onRetry={model.alerts.refetch}
            onSelectAlert={handleSelectAlert}
          />
        );
      case ChartPanel.MONITORING:
        return (
          <MonitoringPanel
            series={views}
            snapshots={model.snapshots}
            isLoading={views.some((view) => view.status === SeriesDataStatus.LOADING)}
            error={undefined}
            onRetry={() => undefined}
            nowMs={Math.max(nowMs, chartWindow.end)}
          />
        );
      case ChartPanel.THRESHOLDS:
        return (
          <ThresholdsPanel
            series={visibleViews}
            shouldShowThresholds={overlayOn(ChartOverlay.THRESHOLDS)}
            onShowThresholdsChange={() =>
              update(toggleOverlay(configuration, ChartOverlay.THRESHOLDS))
            }
            range={chartWindow}
          />
        );
      case ChartPanel.DATA_PROFILING:
        return (
          <DataProfilingPanel
            series={views}
            profiles={model.profiles}
            rangeLabel={`${formatShortDateTime(new Date(chartWindow.start).toISOString())} to ${formatShortDateTime(new Date(chartWindow.end).toISOString())}`}
          />
        );
      case ChartPanel.ASSISTANT:
        return assistantPanel ?? null;
      case ChartPanel.SERIES_INFO:
        return panelView ? <SeriesInfoPanel series={panelView} profile={panelProfile} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="chart-topbar flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0 max-w-sm shrink">
          <ChartHeader
            title={configuration.title}
            onTitleChange={(title) => update(setTitle(configuration, title))}
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-2 gap-y-2">
          <ChartToolbar
            window={chartWindow}
            nowMs={nowMs}
            isMarkerMode={configuration.isMarkerMode}
            isLive={configuration.isLive}
            onRangeChange={(range) => update(setWindow(configuration, range, undefined))}
            onWindowChange={changeWindow}
            onMarkerModeToggle={() =>
              update({ ...configuration, isMarkerMode: !configuration.isMarkerMode })
            }
            onLiveToggle={isLiveDisabled ? undefined : handleLiveToggle}
            isInterpolated={isInterpolated}
            onInterpolatedChange={setIsInterpolated}
          />
          <Separator
            orientation="vertical"
            className="hidden data-[orientation=vertical]:h-6 sm:block"
          />
          {extraActions}
          <ChartActions onAddData={() => togglePanelOf(ChartPanel.ADD_DATA)} />
          {onClose ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-8"
              aria-label={closeLabel}
              title={closeLabel}
              onClick={onClose}
            >
              <IconX size={16} aria-hidden />
            </Button>
          ) : null}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <ChartRail
          panel={configuration.panel}
          onPanelToggle={togglePanelOf}
          assistantLabel={assistantPanel !== undefined ? assistantLabel : undefined}
          onDownloadImage={handleExportImage}
          isDownloadDisabled={visibleViews.length === 0}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {failedViews.length > 0 && visibleViews.length > 0 ? (
            <Alert variant="warning" data-variant="warning">
              <AlertDescription>
                {failedViews.length === 1
                  ? `${failedViews[0]?.definition.name} could not be loaded. The other series are shown.`
                  : `${failedViews.length} series could not be loaded. The others are shown.`}{' '}
                Use Retry in the table.
              </AlertDescription>
            </Alert>
          ) : null}

          <section aria-label="Time series" className="flex min-w-0 flex-col gap-2">
            {model.isRefreshing ? (
              <p role="status" className="text-sm text-muted-foreground">
                Updating
              </p>
            ) : null}
            {views.length === 0 ? (
              <StateMessage
                icon={IconChartLine}
                title="No series on the chart"
                description="Add data to draw its trend. You can compare up to 12 series."
                action={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => togglePanelOf(ChartPanel.ADD_DATA)}
                  >
                    <IconPlus size={16} aria-hidden />
                    Add data
                  </Button>
                }
              />
            ) : visibleViews.length === 0 ? (
              <StateMessage
                size={StateSize.INLINE}
                variant={StateVariant.INFO}
                icon={IconEyeOff}
                title={
                  failedViews.length === views.length
                    ? 'No series could be loaded'
                    : 'Every series is hidden'
                }
                description={
                  failedViews.length === views.length
                    ? 'Retry from the table below.'
                    : 'Show one to draw its trend.'
                }
                action={
                  failedViews.length === views.length ? undefined : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => update(showAllSeries(configuration))}
                    >
                      Show all series
                    </Button>
                  )
                }
              />
            ) : (
              <TimeSeriesPlot
                series={visibleViews}
                window={chartWindow}
                bounds={model.bounds}
                mode={configuration.mode}
                axes={configuration.axes}
                shouldShowGridlines={configuration.shouldShowGridlines}
                shouldShowMinMax={configuration.shouldShowMinMax}
                shouldShowThresholds={overlayOn(ChartOverlay.THRESHOLDS)}
                shouldShowGaps={overlayOn(ChartOverlay.DATA_GAPS)}
                shouldShowBand={overlayOn(ChartOverlay.MIN_MAX_BAND)}
                events={model.events}
                isMarkerMode={configuration.isMarkerMode}
                markerAt={configuration.markerAt}
                isInterpolated={isInterpolated}
                nowMs={nowMs}
                isLive={configuration.isLive}
                heightPx={CHART_WORKSPACE_PLOT_HEIGHT_PX}
                onWindowChange={changeWindow}
                onMarkerChange={(markerAt) => update({ ...configuration, markerAt })}
                onEventSelect={onEventSelect}
                summary={summary}
                svgRef={svgReference}
              />
            )}
            {views.length > 0 ? (
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  data-appearance="link"
                  disabled={configuration.axes.length === 0}
                  onClick={() => update({ ...configuration, axes: [] })}
                >
                  <IconArrowAutofitHeight size={16} aria-hidden />
                  Auto-fit axes
                </Button>
              </div>
            ) : null}
          </section>

          {views.length > 0 ? (
            <SeriesTable
              series={views}
              statisticsScope={`Visible range: ${periodLabel}`}
              onVisibilityChange={(id, isVisible) =>
                update(setSeriesVisible(configuration, id, isVisible))
              }
              onStyleChange={(id: string, style: Partial<SeriesStyle>) =>
                update(setSeriesStyle(configuration, id, style))
              }
              onRemove={(id) => update(removeSeries(configuration, id))}
              onOpenInfo={(seriesId) => handleOpenSeriesPanel(ChartPanel.SERIES_INFO, seriesId)}
              onMove={(id, offset) => update(moveSeries(configuration, id, offset))}
              onDisplayUnitChange={handleDisplayUnit}
              onRetry={model.retrySeries}
              onShowAll={() => update(showAllSeries(configuration))}
              onShowOnly={(id) => update(showOnlySeries(configuration, id))}
            />
          ) : null}
        </div>

        <ChartSidebarSlot
          assistantLabel={assistantLabel}
          panel={configuration.panel}
          onClose={() => update({ ...configuration, panel: undefined })}
          renderPanel={renderPanel}
        />
      </div>
    </div>
  );
}
