import { Button } from '@cognite/aura/components/button';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useId, useState } from 'react';

import { formatDuration } from '../../../lib/monitoring/duration';
import { formatSignalWithUnit } from '../../../lib/monitoring/signalFormat';
import type { ThresholdBreach } from '../../../types/timeSeriesChart';

import { formatChartInstantShort, formatCountOf } from './panelFormat';

interface ThresholdBreachListProperties {
  summary: string;
  breaches: readonly ThresholdBreach[];
  unit: string;
}

const VISIBLE_BREACH_COUNT = 5;

export function ThresholdBreachList({ summary, breaches, unit }: ThresholdBreachListProperties) {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const Chevron = isOpen ? IconChevronDown : IconChevronRight;
  const hiddenCount = Math.max(0, breaches.length - VISIBLE_BREACH_COUNT);
  const summaryText = <p className="tabular-nums text-xs text-muted-foreground">{summary}</p>;
  if (breaches.length === 0) return summaryText;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        {summaryText}
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          aria-controls={listId}
          onClick={() => setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen)}
        >
          <Chevron aria-hidden />
          {formatCountOf(breaches.length, 'period')}
        </Button>
      </div>
      {isOpen ? (
        <ul id={listId} aria-label="Periods beyond the limit" className="flex flex-col gap-1">
          {breaches.slice(0, VISIBLE_BREACH_COUNT).map((breach) => (
            <li
              key={`${breach.from}-${breach.to}`}
              className="tabular-nums flex items-baseline justify-between gap-3 text-xs text-muted-foreground"
            >
              <span>
                {formatChartInstantShort(breach.from)}
                {breach.to === breach.from
                  ? ''
                  : ` to ${formatChartInstantShort(breach.to)} (${formatDuration(breach.to - breach.from)})`}
              </span>
              <span className="shrink-0 text-foreground">
                peak {formatSignalWithUnit(breach.peak, unit)}
              </span>
            </li>
          ))}
          {hiddenCount > 0 ? (
            <li className="text-xs text-muted-foreground">{hiddenCount} more</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
