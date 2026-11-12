import { Button } from '@cognite/aura/components/button';
import { IconEye, IconEyeOff, IconInfoCircle, IconX } from '@tabler/icons-react';

import { SERIES_STATUS_LABELS, SERIES_STATUS_TONES } from '../../../constants/timeSeriesChart';
import { SeriesDataStatus } from '../../../enums/timeSeriesChart';
import { formatSignalValue } from '../../../lib/monitoring/signalFormat';
import { convertibleUnits } from '../../../lib/time-series-chart/units';
import { cn } from '../../../lib/utils';
import type { ChartSeriesView, SeriesStyle } from '../../../types/timeSeriesChart';
import { FilterSelect } from '../../general/FilterSelect';
import { StatusPill } from '../../general/StatusPill';
import { TABLE_CELL_CLASS, TABLE_ROW_CLASS } from '../../monitoring/tableStyles';

import { IconTooltipButton } from './IconTooltipButton';
import { MetadataText } from './MetadataText';
import { SeriesMoreMenu } from './SeriesMoreMenu';
import { SeriesStyleControl } from './SeriesStyleControl';
import { TruncatedText } from './TruncatedText';

const MIN_UNIT_CHOICES = 2;

export interface SeriesRowActions {
  onVisibilityChange: (seriesId: string, isVisible: boolean) => void;
  onStyleChange: (seriesId: string, style: Partial<SeriesStyle>) => void;
  onRemove: (seriesId: string) => void;
  onOpenInfo: (seriesId: string) => void;
  onMove: (seriesId: string, offset: -1 | 1) => void;
  onDisplayUnitChange: (seriesId: string, unit: string | undefined) => void;
  onRetry: (seriesId: string) => void;
  onShowAll: () => void;
  onShowOnly: (seriesId: string) => void;
}

interface SeriesRowProperties {
  series: ChartSeriesView;
  position: number;
  seriesCount: number;
  hiddenCount: number;
  onShowOnly: (seriesId: string) => void;
  actions: SeriesRowActions;
}

const DEFAULT_ERROR_TEXT = 'The readings could not be loaded.';

function StatisticCell({ value }: { value: number | null }) {
  const text = formatSignalValue(value);
  if (value !== null) return <>{text}</>;
  return (
    <>
      <span aria-hidden>{text}</span>
      <span className="sr-only">No value</span>
    </>
  );
}

function UnitCell({
  series,
  onDisplayUnitChange,
}: {
  series: ChartSeriesView;
  onDisplayUnitChange: (unit: string | undefined) => void;
}) {
  const ownUnit = series.definition.unit?.trim() ? series.definition.unit : undefined;
  if (ownUnit === undefined) return <MetadataText value={undefined} />;
  const choices = convertibleUnits(ownUnit);
  if (choices.length < MIN_UNIT_CHOICES) return <>{ownUnit}</>;
  const chosen = series.configuration.displayUnit;
  const current = chosen !== undefined && choices.includes(chosen) ? chosen : ownUnit;
  return (
    <FilterSelect
      label={`Display unit of ${series.definition.name}`}
      isLabelHidden
      hasAllOption={false}
      value={current}
      options={choices.map((unit) => ({ value: unit, label: unit }))}
      onChange={(next) => {
        if (next !== undefined) onDisplayUnitChange(next === ownUnit ? undefined : next);
      }}
    />
  );
}

export function SeriesRow({
  series,
  position,
  seriesCount,
  hiddenCount,
  onShowOnly,
  actions,
}: SeriesRowProperties) {
  const { definition, configuration } = series;
  const seriesId = definition.id;
  const name = definition.name;
  const isVisible = configuration.isVisible;
  const isError = series.status === SeriesDataStatus.ERROR;
  const visibleCount = seriesCount - hiddenCount;
  const dataCell = cn(TABLE_CELL_CLASS, !isVisible && 'opacity-60');
  const numberCell = cn(dataCell, 'tabular-nums whitespace-nowrap text-right');
  const controlCell = 'px-2 py-1.5';
  return (
    <tr className={TABLE_ROW_CLASS} data-hidden={!isVisible}>
      <td className={controlCell}>
        <SeriesStyleControl
          seriesName={name}
          style={configuration.style}
          onStyleChange={(style) => actions.onStyleChange(seriesId, style)}
        />
      </td>
      <td className={controlCell}>
        <IconTooltipButton
          label={`Show ${name} on the chart`}
          tooltip={isVisible ? 'Hide series' : 'Show series'}
          icon={isVisible ? IconEye : IconEyeOff}
          isPressed={isVisible}
          onClick={() => actions.onVisibilityChange(seriesId, !isVisible)}
        />
      </td>
      <th scope="row" className={cn(dataCell, 'text-left font-medium text-foreground')}>
        <TruncatedText text={name} className="max-w-[12rem]" />
      </th>
      <td className={dataCell}>
        <div className="flex min-w-24 flex-col items-start gap-1">
          <StatusPill
            label={SERIES_STATUS_LABELS[series.status]}
            tone={SERIES_STATUS_TONES[series.status]}
          />
          {isError ? (
            <>
              <p className="max-w-[14rem] text-xs text-destructive-foreground">
                {series.errorMessage ?? DEFAULT_ERROR_TEXT}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Retry loading ${name}`}
                className="gap-1"
                onClick={() => actions.onRetry(seriesId)}
              >
                Retry
              </Button>
            </>
          ) : null}
        </div>
      </td>
      <td className={cn(dataCell, 'whitespace-nowrap')}>
        <MetadataText value={definition.tag} />
      </td>
      <td className={dataCell}>
        {definition.description.trim() ? (
          <TruncatedText text={definition.description} className="max-w-[12rem]" />
        ) : (
          <MetadataText value={undefined} />
        )}
      </td>
      <td className={numberCell}>
        <StatisticCell value={series.statistics.min} />
      </td>
      <td className={numberCell}>
        <StatisticCell value={series.statistics.max} />
      </td>
      <td className={numberCell}>
        <StatisticCell value={series.statistics.mean} />
      </td>
      <td className={cn(dataCell, 'whitespace-nowrap')}>
        <UnitCell
          series={series}
          onDisplayUnitChange={(unit) => actions.onDisplayUnitChange(seriesId, unit)}
        />
      </td>
      <td className={controlCell}>
        <IconTooltipButton
          label={`Remove ${name} from the chart`}
          tooltip="Remove from the chart"
          icon={IconX}
          onClick={() => actions.onRemove(seriesId)}
        />
      </td>
      <td className={controlCell}>
        <IconTooltipButton
          label={`Information about ${name}`}
          tooltip="Series information"
          icon={IconInfoCircle}
          onClick={() => actions.onOpenInfo(seriesId)}
        />
      </td>
      <td className={controlCell}>
        <SeriesMoreMenu
          seriesName={name}
          canMoveUp={position > 0}
          canMoveDown={position < seriesCount - 1}
          canShowOnly={!(isVisible && visibleCount === 1)}
          canShowAll={hiddenCount > 0}
          onMove={(offset) => actions.onMove(seriesId, offset)}
          onShowOnly={() => onShowOnly(seriesId)}
          onShowAll={actions.onShowAll}
        />
      </td>
    </tr>
  );
}
