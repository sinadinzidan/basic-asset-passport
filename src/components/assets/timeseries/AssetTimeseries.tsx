import { lazy, Suspense } from 'react';

import {
  SHOW_MORE_TIMESERIES_LABEL,
  TIMESERIES_EMPTY_DESCRIPTION,
  TIMESERIES_EMPTY_TITLE,
  TIMESERIES_ERROR_DESCRIPTION,
  TIMESERIES_ERROR_TITLE,
  TIMESERIES_LOADING_MESSAGE,
  TIMESERIES_QUERY_LIMIT,
} from '../../../constants/timeseries';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetTimeseriesViewModel } from '../../../hooks/assets/timeseries/useAssetTimeseriesViewModel';
import { useTimeseriesChartViewModel } from '../../../hooks/assets/timeseries/useTimeseriesChartViewModel';
import { useListLimit } from '../../../hooks/general/useListLimit';
import { getErrorReason } from '../../../lib/errorReason';
import { getTimeseriesKey, getTimeseriesName } from '../../../lib/timeseriesProperties';
import type { AssetInstanceDetails } from '../../../types/asset';
import { EmptyStateMessage, LoadingNotice, RetryAlert, ShowMoreButton } from '../../general';

import { TimeseriesDetails } from './TimeseriesDetails';

const TimeseriesChartDialog = lazy(() =>
  import('./TimeseriesChartDialog').then((module) => ({
    default: module.TimeseriesChartDialog,
  })),
);

export function AssetTimeseries() {
  const { limit, showMore } = useListLimit(TIMESERIES_QUERY_LIMIT);
  const {
    items,
    timeseries,
    hasMore,
    error,
    isError,
    isFetching,
    isLoadingMore,
    isPending,
    retry,
  } = useAssetTimeseriesViewModel(limit);
  const chart = useTimeseriesChartViewModel(timeseries);

  function handleOpenChart(opened: AssetInstanceDetails): void {
    chart.openSeries(getTimeseriesKey(opened), getTimeseriesName(opened));
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message={TIMESERIES_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title={TIMESERIES_ERROR_TITLE}
        description={TIMESERIES_ERROR_DESCRIPTION}
        reason={getErrorReason(error)}
        isRetrying={isFetching}
        onRetry={retry}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyStateMessage
        title={TIMESERIES_EMPTY_TITLE}
        description={TIMESERIES_EMPTY_DESCRIPTION}
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
            label={SHOW_MORE_TIMESERIES_LABEL}
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
            exportName={chart.exportName}
            onConfigurationChange={chart.setConfiguration}
            onClose={chart.close}
          />
        </Suspense>
      ) : null}
    </>
  );
}
