import { CHART_MAX_CONFIGURED_THRESHOLDS } from '../../constants/timeSeriesChart';
import { ThresholdSource } from '../../enums/timeSeriesChart';
import type {
  ChartConfiguration,
  ChartThreshold,
  ConfiguredThreshold,
} from '../../types/timeSeriesChart';

import type { ConfigurationResult } from './configuration';

const ID_PREFIX = 'configured';

/** The identity of an added threshold: its series, level, side and value. Two with the same four are the same line. */
export function configuredThresholdId(threshold: ConfiguredThreshold): string {
  return [ID_PREFIX, threshold.seriesId, threshold.level, threshold.side, threshold.value].join(
    ':',
  );
}

/** An added threshold in the shape the plot and the panel draw, marked as configured so it is told apart from the data source's. */
export function toChartThreshold(threshold: ConfiguredThreshold): ChartThreshold {
  return {
    id: configuredThresholdId(threshold),
    seriesId: threshold.seriesId,
    level: threshold.level,
    side: threshold.side,
    value: threshold.value,
    unit: threshold.unit,
    source: ThresholdSource.CONFIGURED,
  };
}

/** The number a threshold value field holds, or why it holds none. A comma is read as a decimal point. */
export function parseThresholdValue(text: string): { value?: number; error?: string } {
  const trimmed = text.trim().replace(',', '.');

  if (trimmed === '') return { error: 'Enter a value for the threshold.' };

  const value = Number(trimmed);

  return Number.isFinite(value) ? { value } : { error: 'The value must be a number.' };
}

export function addConfiguredThreshold(
  configuration: ChartConfiguration,
  threshold: ConfiguredThreshold,
): ConfigurationResult {
  if (!configuration.series.some((entry) => entry.seriesId === threshold.seriesId))
    return { configuration, error: 'This series is not on the chart.' };

  const id = configuredThresholdId(threshold);

  if (configuration.thresholds.some((entry) => configuredThresholdId(entry) === id))
    return { configuration, error: 'This threshold is already on the chart.' };

  if (configuration.thresholds.length >= CHART_MAX_CONFIGURED_THRESHOLDS)
    return {
      configuration,
      error: `You can add up to ${CHART_MAX_CONFIGURED_THRESHOLDS} thresholds.`,
    };

  return {
    configuration: { ...configuration, thresholds: [...configuration.thresholds, threshold] },
  };
}

export function removeConfiguredThreshold(
  configuration: ChartConfiguration,
  thresholdId: string,
): ChartConfiguration {
  return {
    ...configuration,
    thresholds: configuration.thresholds.filter(
      (entry) => configuredThresholdId(entry) !== thresholdId,
    ),
  };
}
