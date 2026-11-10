import {
  THRESHOLD_LEVEL_LABELS,
  THRESHOLD_LEVEL_TONES,
  THRESHOLD_SOURCE_LABELS,
} from '../../../constants/timeSeriesChart';
import { PillSize } from '../../../enums/display';
import { ThresholdSide } from '../../../enums/timeSeriesChart';
import { formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import { countBeyond } from '../../../lib/time-series-chart/thresholds';
import type { ChartSeriesView, ChartThreshold, ChartTimeRange, ThresholdBreach } from '../../../types/timeSeriesChart';
import { StatusPill } from '../../general/StatusPill';

import { formatCountOf } from './panelFormat';
import { ThresholdBreachList } from './ThresholdBreachList';

const THRESHOLD_SIDE_TITLES: Record<ThresholdSide, string> = {
  [ThresholdSide.UPPER]: 'High limit',
  [ThresholdSide.LOWER]: 'Low limit',
};

interface ThresholdRowProps {
  threshold: ChartThreshold;
  series: ChartSeriesView;
  range: ChartTimeRange;
  breaches: readonly ThresholdBreach[];
  /** True when the series mixes data-source and configured limits, the only time the source says something. */
  isSourceShown: boolean;
}

export function ThresholdRow({ threshold, series, range, breaches, isSourceShown }: ThresholdRowProps) {
  const beyondCount = countBeyond(series.points, threshold, range);
  const summary = `${beyondCount === 0 ? 'No readings' : formatCountOf(beyondCount, 'reading')} beyond${isSourceShown ? ` · ${THRESHOLD_SOURCE_LABELS[threshold.source]}` : ''}`;
  return (
    <li className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <StatusPill
          label={THRESHOLD_LEVEL_LABELS[threshold.level]}
          tone={THRESHOLD_LEVEL_TONES[threshold.level]}
          size={PillSize.SMALL}
        />
        <span className="min-w-0 truncate text-sm text-foreground">
          {threshold.label ?? THRESHOLD_SIDE_TITLES[threshold.side]}
        </span>
        <span
          title={THRESHOLD_SOURCE_LABELS[threshold.source]}
          className="tabular-nums ml-auto shrink-0 text-sm font-semibold text-foreground"
        >
          {formatSignalWithUnit(threshold.value, threshold.unit)}
        </span>
      </div>
      <ThresholdBreachList summary={summary} breaches={breaches} unit={threshold.unit} />
    </li>
  );
}
