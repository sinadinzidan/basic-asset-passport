import {
  ChartRange,
  createChartConfiguration,
  nowToMinuteMs,
  parseConfiguration,
  serialiseConfiguration,
  type ChartConfiguration,
  type ChartDataSource,
} from '@flows/trend-chart';
import { createContext, useContext, useMemo } from 'react';

import {
  CHART_MOCK_SOURCE_NAME,
  CHART_OPEN_WINDOW_MS,
  CHART_SOURCE_NAME,
} from '../../../constants/timeseries';
import { createTimeseriesChartAdapter } from '../../../services/assets/timeseries/timeseriesChartAdapter';
import type {
  AssetIdentifier,
  AssetInstanceDetails,
} from '../../../types/asset';
import { useTimeseriesDatapointsClient } from '../../timeseries/useTimeseriesDatapointsClient';

import { useTimeseriesChartState } from './useTimeseriesChartState';

const defaultDeps = {
  useTimeseriesChartState,
  useTimeseriesDatapointsClient,
  now: () => Date.now(),
};

export type UseTimeseriesChartViewModelContextType = typeof defaultDeps;
export const UseTimeseriesChartViewModelContext =
  createContext<UseTimeseriesChartViewModelContextType>(defaultDeps);

/**
 * The chart workspace of one asset's series: its data source, its setup and
 * the commands that open, change and close it. The setup itself lives in the
 * shared chart state, so this hook holds none.
 */
export function useTimeseriesChartViewModel(
  assetIdentifier: AssetIdentifier,
  series: readonly AssetInstanceDetails[],
) {
  const {
    useTimeseriesChartState: useChartState,
    useTimeseriesDatapointsClient: useClient,
    now,
  } = useContext(UseTimeseriesChartViewModelContext);
  const { options, onChange } = useChartState();
  const client = useClient();
  const isOpen = options !== null;

  const source = useMemo<ChartDataSource>(
    () => ({
      adapter: createTimeseriesChartAdapter(client, series, {
        sourceName: client.isSimulated
          ? CHART_MOCK_SOURCE_NAME
          : CHART_SOURCE_NAME,
        isSimulated: client.isSimulated === true,
      }),
      scopeKey: `timeseries:${client.project}:${assetIdentifier.space}:${assetIdentifier.externalId}`,
    }),
    [client, series, assetIdentifier.space, assetIdentifier.externalId],
  );
  const configuration = useMemo<ChartConfiguration | null>(
    () =>
      options
        ? parseConfiguration(options, createChartConfiguration([]))
        : null,
    [options],
  );
  // "Now" is fixed per opening, so the chart's window does not drift while it is used.
  const nowMs = useMemo(
    () => nowToMinuteMs(new Date(now()).toISOString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen],
  );

  /** Opens the chart on one series, showing the last six months until the user picks another range. */
  function openSeries(seriesId: string, title: string): void {
    const endMs = nowToMinuteMs(new Date(now()).toISOString());
    onChange(
      serialiseConfiguration(
        createChartConfiguration([seriesId], {
          title,
          range: ChartRange.CUSTOM,
          window: { start: endMs - CHART_OPEN_WINDOW_MS, end: endMs },
        }),
      ),
    );
  }

  function close(): void {
    onChange(null);
  }

  function setConfiguration(next: ChartConfiguration): void {
    onChange(serialiseConfiguration(next));
  }

  return {
    isOpen,
    source,
    configuration,
    nowMs,
    openSeries,
    close,
    setConfiguration,
  };
}
