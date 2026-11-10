import { IconArrowsMaximize, IconChartLine } from '@tabler/icons-react';
import { useId } from 'react';

import type { AssetTimeseriesItem } from '../../../hooks/assets/timeseries/useAssetTimeseriesViewModel';
import { getTimeseriesDisplayProperties } from '../../../lib/timeseriesProperties';
import { getTimeseriesName } from '../../../services/assets/timeseries/assetTimeseriesService';
import { AssetProperties } from '../AssetProperties';

import { TimeseriesPreview } from './TimeseriesPreview';

type TimeseriesDetailsProps = {
  item: AssetTimeseriesItem;
  /** Opens this series in the chart; left out when it cannot be charted. */
  onOpenChart?: (timeseries: AssetTimeseriesItem['timeseries']) => void;
};

/** One time series: its name, a preview of its last 6 months and the properties CDF holds for it. */
export function TimeseriesDetails({ item, onOpenChart }: TimeseriesDetailsProps) {
  const { timeseries, preview, unit } = item;
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="data-card flex flex-col">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="icon-chip size-9">
            <IconChartLine className="size-5" />
          </span>
          <h3 id={headingId} className="font-display min-w-0 break-words text-lg font-semibold tracking-wide">
            {getTimeseriesName(timeseries)}
          </h3>
        </div>
      </header>
      {onOpenChart && preview.kind !== 'NON_NUMERIC' ? (
        <button
          type="button"
          className="timeseries-open"
          aria-label={`Open ${getTimeseriesName(timeseries)} in the chart`}
          onClick={() => onOpenChart(timeseries)}
        >
          <TimeseriesPreview preview={preview} unit={unit} />
          <span aria-hidden className="timeseries-open__hint">
            <IconArrowsMaximize className="size-4" />
            Open chart
          </span>
        </button>
      ) : (
        <TimeseriesPreview preview={preview} unit={unit} />
      )}
      <AssetProperties
        properties={getTimeseriesDisplayProperties(timeseries)}
      />
    </section>
  );
}
