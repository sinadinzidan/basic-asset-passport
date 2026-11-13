import { Button } from '@cognite/aura/components/button';
import { IconArrowsMaximize, IconChartLine } from '@tabler/icons-react';
import { useId } from 'react';

import { TimeseriesPreviewKind } from '../../../enums/timeseriesPreviewKind';
import type { AssetTimeseriesItem } from '../../../hooks/assets/timeseries/view-models/useAssetTimeseriesViewModel';
import {
  getTimeseriesDisplayProperties,
  getTimeseriesName,
} from '../../../lib/timeseriesProperties';
import { AssetProperties } from '../AssetProperties';

import { TimeseriesPreview } from './TimeseriesPreview';

type TimeseriesDetailsProps = {
  item: AssetTimeseriesItem;
  onOpenChart?: (timeseries: AssetTimeseriesItem['timeseries']) => void;
};

export function TimeseriesDetails({ item, onOpenChart }: TimeseriesDetailsProps) {
  const headingId = useId();

  const { timeseries, preview, unit } = item;
  const name = getTimeseriesName(timeseries);

  function handleOpenChartClick(): void {
    onOpenChart?.(timeseries);
  }

  return (
    <section aria-labelledby={headingId} className="data-card flex flex-col">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconChartLine className="size-5" />
          </span>
          <h3
            id={headingId}
            className="font-display min-w-0 break-words text-lg font-semibold tracking-wide"
          >
            {name}
          </h3>
        </div>
      </header>
      {onOpenChart && preview.kind !== TimeseriesPreviewKind.NON_NUMERIC ? (
        <Button className="timeseries-open" onClick={handleOpenChartClick} variant="ghost">
          <span className="sr-only">{name}: </span>
          <TimeseriesPreview preview={preview} unit={unit} />
          <span className="timeseries-open__hint">
            <IconArrowsMaximize aria-hidden className="size-4" />
            Open chart
          </span>
        </Button>
      ) : (
        <TimeseriesPreview preview={preview} unit={unit} />
      )}
      <AssetProperties properties={getTimeseriesDisplayProperties(timeseries)} />
    </section>
  );
}
