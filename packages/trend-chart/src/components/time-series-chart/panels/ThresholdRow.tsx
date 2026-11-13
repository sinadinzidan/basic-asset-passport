import { IconX } from '@tabler/icons-react';

import {
  THRESHOLD_LEVEL_LABELS,
  THRESHOLD_LEVEL_TONES,
  THRESHOLD_SIDE_LABELS,
  THRESHOLD_SOURCE_LABELS,
} from '../../../constants/timeSeriesChart';
import { PillSize } from '../../../enums/display';
import { ThresholdSource } from '../../../enums/timeSeriesChart';
import { formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import { countBeyond } from '../../../lib/time-series-chart/thresholds';
import type {
  ChartSeriesView,
  ChartThreshold,
  ChartTimeRange,
  ThresholdBreach,
} from '../../../types/timeSeriesChart';
import { StatusPill } from '../../general/StatusPill';
import { IconTooltipButton } from '../series/IconTooltipButton';

import { formatCountOf } from './panelFormat';
import { ThresholdBreachList } from './ThresholdBreachList';

interface ThresholdRowProperties {
  threshold: ChartThreshold;
  series: ChartSeriesView;
  range: ChartTimeRange;
  breaches: readonly ThresholdBreach[];
  /** True when the series mixes data-source and configured limits, the only time the source says something. */
  isSourceShown: boolean;
  /** Given for a threshold the user added, which is the only kind that can be taken off the chart. */
  onRemove?: (thresholdId: string) => void;
}

export function ThresholdRow({
  threshold,
  series,
  range,
  breaches,
  isSourceShown,
  onRemove,
}: ThresholdRowProperties) {
  const title = threshold.label ?? THRESHOLD_SIDE_LABELS[threshold.side];
  const canRemove = onRemove !== undefined && threshold.source === ThresholdSource.CONFIGURED;
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
        <span className="min-w-0 truncate text-sm text-foreground">{title}</span>
        <span
          title={THRESHOLD_SOURCE_LABELS[threshold.source]}
          className="tabular-nums ml-auto shrink-0 text-sm font-semibold text-foreground"
        >
          {formatSignalWithUnit(threshold.value, threshold.unit)}
        </span>
        {canRemove ? (
          <IconTooltipButton
            label={`Remove the ${THRESHOLD_LEVEL_LABELS[threshold.level].toLowerCase()} ${title.toLowerCase()} of ${series.definition.name}`}
            tooltip="Remove threshold"
            icon={IconX}
            onClick={() => onRemove(threshold.id)}
          />
        ) : null}
      </div>
      <ThresholdBreachList summary={summary} breaches={breaches} unit={threshold.unit} />
    </li>
  );
}
