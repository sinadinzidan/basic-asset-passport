import { lazy, Suspense } from 'react';

import { TIMESERIES_QUERY_LIMIT } from '../../../constants/timeseries';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetTimeseriesViewModel } from '../../../hooks/assets/timeseries/useAssetTimeseriesViewModel';
import { useTimeseriesChartViewModel } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { useListLimit } from '../../../hooks/general/useListLimit';
import { getTimeseriesKey, getTimeseriesName } from '../../../lib/timeseriesProperties';
import type { AssetIdentifier, AssetInstanceDetails } from '../../../types/asset';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { ShowMoreButton } from '../../general/ShowMoreButton';

import { TimeseriesDetails } from './TimeseriesDetails';

const TimeseriesChartDialog = lazy(() =>
  import('./TimeseriesChartDialog').then((module) => ({
    default: module.TimeseriesChartDialog,
  })),
);

type AssetTimeseriesProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetTimeseries({ assetIdentifier }: AssetTimeseriesProps) {
  const { limit, showMore } = useListLimit(TIMESERIES_QUERY_LIMIT);
  const { items, timeseries, hasMore, isError, isFetching, isLoadingMore, isPending, retry } =
    useAssetTimeseriesViewModel(assetIdentifier, limit);
  const chart = useTimeseriesChartViewModel(assetIdentifier, timeseries);

  function handleOpenChart(opened: AssetInstanceDetails): void {
    chart.openSeries(getTimeseriesKey(opened), getTimeseriesName(opened));
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message="Loading timeseries..."
        variant={LoadingNoticeVariant.CARD}
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
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
          {items.map((item) => (
            <TimeseriesDetails
              key={getTimeseriesKey(item.timeseries)}
              item={item}
              onOpenChart={handleOpenChart}
            />
          ))}
        </div>
        {hasMore ? (
          <ShowMoreButton
            label="Show more timeseries"
            isLoading={isLoadingMore}
            onShowMore={showMore}
          />
        ) : null}
      </div>
      {chart.isOpen ? (
        <Suspense fallback={null}>
          <TimeseriesChartDialog
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
