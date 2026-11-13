import { AssetDetailsSkeleton, AssetDetailsTabs } from '../../components/assets';
import {
  CriticalityPill,
  PageHeader,
  PageShell,
  RetryAlert,
  StatusPill,
} from '../../components/general';
import { ASSET_DETAILS_ERROR_DESCRIPTION, ASSET_DETAILS_ERROR_TITLE } from '../../constants/assets';
import { useAssetDetailsViewModel } from '../../hooks/assets/useAssetDetailsViewModel';
import { getStatusTone } from '../../lib/assetStatus';
import { getErrorReason } from '../../lib/errorReason';

export function AssetDetails() {
  const {
    asset,
    title,
    status,
    criticality,
    tabCounts,
    error,
    isError,
    isFetching,
    isPending,
    retry,
  } = useAssetDetailsViewModel();

  if (isPending) {
    return (
      <PageShell>
        <AssetDetailsSkeleton />
      </PageShell>
    );
  }

  if (isError || asset === undefined) {
    return (
      <PageShell>
        <RetryAlert
          title={ASSET_DETAILS_ERROR_TITLE}
          description={ASSET_DETAILS_ERROR_DESCRIPTION}
          reason={getErrorReason(error)}
          isRetrying={isFetching}
          onRetry={retry}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Asset passport"
        title={title}
        badges={
          <>
            {status ? <StatusPill status={status} tone={getStatusTone(status)} /> : null}
            {criticality ? <CriticalityPill criticality={criticality} /> : null}
          </>
        }
      />
      <AssetDetailsTabs asset={asset} tabCounts={tabCounts} />
    </PageShell>
  );
}
