import { cn } from '../../../lib/utils';
import type { ChartSeriesView } from '../../../types/timeSeriesChart';

interface SeriesLabelProps {
  series: ChartSeriesView;
  isQuiet?: boolean;
}

export function SeriesLabel({ series, isQuiet = false }: SeriesLabelProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden
        className="inline-block size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: series.configuration.style.color }}
      />
      <span
        className={cn('truncate', isQuiet ? 'text-xs text-muted-foreground' : 'text-sm font-semibold text-foreground')}
      >
        {series.definition.name}
      </span>
    </span>
  );
}
