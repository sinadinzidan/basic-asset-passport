import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChartLine } from '@tabler/icons-react';

import { cn } from '../../../lib/utils';
import type { ChartSeriesView } from '../../../types/timeSeriesChart';
import { SectionCard } from '../../general/SectionCard';
import { StateMessage } from '../../general/StateMessage';
import { TABLE_HEADER_CELL_CLASS, TABLE_HEAD_ROW_CLASS } from '../../monitoring/tableStyles';

import { SeriesRow } from './SeriesRow';
import type { SeriesRowActions } from './SeriesRow';

export interface SeriesTableProps extends SeriesRowActions {
  series: readonly ChartSeriesView[];
  statisticsScope: string;
}

const COLUMN_LABELS = ['Style', 'Visibility', 'Name', 'Status', 'Tag', 'Description'] as const;
const TRAILING_COLUMN_LABELS = ['Unit', 'Remove', 'Info', 'More'] as const;

function StatisticHeader({ label, scope }: { label: string; scope: string }) {
  return (
    <th scope="col" className={cn(TABLE_HEADER_CELL_CLASS, 'text-right')}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="cursor-help rounded-sm focus-visible:outline-2 focus-visible:outline-ring" />
          }
        >
          {label}
        </TooltipTrigger>
        <TooltipContent>{`${label}: ${scope}`}</TooltipContent>
      </Tooltip>
    </th>
  );
}

export function SeriesTable({ series, statisticsScope, ...actions }: SeriesTableProps) {
  const hiddenCount = series.filter((entry) => !entry.configuration.isVisible).length;

  if (series.length === 0) {
    return (
      <SectionCard title="Series">
        <StateMessage
          variant="empty"
          size="panel"
          icon={IconChartLine}
          title="No series on the chart"
          description="Use Add data to choose the time series to plot."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Series"
      aside={hiddenCount > 0 ? `${series.length} series, ${hiddenCount} hidden` : `${series.length} series`}
      actions={
        hiddenCount > 0 ? (
          <Button type="button" variant="outline" size="sm" onClick={actions.onShowAll}>
            Show all
          </Button>
        ) : undefined
      }
      description={statisticsScope}
      isFlush
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-sm">
          <caption className="sr-only">{`Series on the chart. Min, Max and Mean cover: ${statisticsScope}`}</caption>
          <thead>
            <tr className={TABLE_HEAD_ROW_CLASS}>
              {COLUMN_LABELS.map((label) => (
                <th key={label} scope="col" className={TABLE_HEADER_CELL_CLASS}>
                  {label}
                </th>
              ))}
              <StatisticHeader label="Min" scope={statisticsScope} />
              <StatisticHeader label="Max" scope={statisticsScope} />
              <StatisticHeader label="Mean" scope={statisticsScope} />
              {TRAILING_COLUMN_LABELS.map((label) => (
                <th key={label} scope="col" className={TABLE_HEADER_CELL_CLASS}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((entry, position) => (
              <SeriesRow
                key={entry.definition.id}
                series={entry}
                position={position}
                seriesCount={series.length}
                hiddenCount={hiddenCount}
                onShowOnly={actions.onShowOnly}
                actions={actions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
