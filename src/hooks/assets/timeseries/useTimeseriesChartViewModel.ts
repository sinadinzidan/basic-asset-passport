import {
  ChartRange,
  createChartConfiguration,
  nowToMinuteMs,
  parseConfiguration,
  serialiseConfiguration,
  type ChartConfiguration,
  type ChartDataSource,
} from '@flows/trend-chart';
import { createContext, useContext, useMemo, useState } from 'react';

import {
  CHART_MOCK_SOURCE_NAME,
  CHART_OPEN_WINDOW_MS,
  CHART_SOURCE_NAME,
} from '../../../constants/timeseries';
import { createTimeseriesChartAdapter } from '../../../services/assets/timeseries/timeseriesChartAdapter';
import type { AssetInstanceDetails } from '../../../types/asset';
import { useNavigationState } from '../../general/useNavigationState';
import { useSelectedAsset } from '../useSelectedAsset';

import { useTimeseriesContext } from './useTimeseriesContext';

const defaultDeps = { now: () => Date.now() };

export type UseTimeseriesChartViewModelContextType = typeof defaultDeps;
export const UseTimeseriesChartViewModelContext =
  createContext<UseTimeseriesChartViewModelContextType>(defaultDeps);

export function useTimeseriesChartViewModel(series: readonly AssetInstanceDetails[]) {
  const assetIdentifier = useSelectedAsset();
  const { now } = useContext(UseTimeseriesChartViewModelContext);
  const options = useNavigationState((store) => store.navigationState.timeseriesChart ?? null);
  const changeTimeseriesChart = useNavigationState((store) => store.actions.changeTimeseriesChart);
  const client = useTimeseriesContext();

  const [nowMs, setNowMs] = useState(() => currentMinuteMs(now));

  const isOpen = options !== null;
  const isSimulated = client.isSimulated === true;
  const source = useMemo<ChartDataSource>(
    () => ({
      adapter: createTimeseriesChartAdapter(client, series, {
        sourceName: isSimulated ? CHART_MOCK_SOURCE_NAME : CHART_SOURCE_NAME,
        isSimulated,
      }),
      scopeKey: `timeseries:${client.project}:${assetIdentifier.space}:${assetIdentifier.externalId}`,
    }),
    [client, isSimulated, series, assetIdentifier.space, assetIdentifier.externalId],
  );
  const configuration = useMemo<ChartConfiguration | null>(
    () => (options ? parseConfiguration(options, createChartConfiguration([])) : null),
    [options],
  );

  function openSeries(seriesId: string, title: string): void {
    const endMs = currentMinuteMs(now);
    setNowMs(endMs);
    changeTimeseriesChart(
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
    changeTimeseriesChart(null);
  }

  function setConfiguration(next: ChartConfiguration): void {
    changeTimeseriesChart(serialiseConfiguration(next));
  }

  return {
    isOpen,
    source,
    configuration,
    nowMs,
    exportName: assetIdentifier.externalId,
    openSeries,
    close,
    setConfiguration,
  };
}

function currentMinuteMs(now: () => number): number {
  return nowToMinuteMs(new Date(now()).toISOString());
}
