import { lazy, Suspense } from 'react';

import { useAssetTimeseriesViewModel } from '../../../hooks/assets/timeseries/useAssetTimeseriesViewModel';
import { useTimeseriesChartViewModel } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { getTimeseriesKey } from '../../../lib/timeseriesProperties';
import { getTimeseriesName } from '../../../services/assets/timeseries/assetTimeseriesService';
import type { AssetIdentifier } from '../../../types/asset';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';

import { TimeseriesDetails } from './TimeseriesDetails';

// The chart is large, so it is only downloaded when a series is first opened.
const TimeseriesChartDialog = lazy(() =>
  import('./TimeseriesChartDialog').then((module) => ({
    default: module.TimeseriesChartDialog,
  })),
);

type AssetTimeseriesProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetTimeseries({ assetIdentifier }: AssetTimeseriesProps) {
  const { items, isError, isFetching, isPending, retry } =
    useAssetTimeseriesViewModel(assetIdentifier);
  const chart = useTimeseriesChartViewModel(
    assetIdentifier,
    items.map(({ timeseries }) => timeseries),
  );

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message="Loading timeseries..."
        variant="CARD"
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title="Timeseries could not be loaded"
        description="Check access to the Timeseries view, then try again."
        isRetrying={isFetching}
        onRetry={retry}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyStateMessage
        title="No timeseries linked"
        description="There are no Timeseries instances linked to this asset."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
        {items.map((item) => (
          <TimeseriesDetails
            key={getTimeseriesKey(item.timeseries)}
            item={item}
            onOpenChart={(timeseries) =>
              chart.openSeries(
                getTimeseriesKey(timeseries),
                getTimeseriesName(timeseries),
              )
            }
          />
        ))}
      </div>
      {chart.isOpen ? (
        <Suspense fallback={null}>
          <TimeseriesChartDialog
            isOpen
            source={chart.source}
            configuration={chart.configuration}
            nowMs={chart.nowMs}
            exportName={assetIdentifier.externalId}
            onConfigurationChange={chart.setConfiguration}
            onClose={chart.close}
          />
        </Suspense>
      ) : null}
    </>
  );
}
