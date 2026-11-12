import { AssetDetailsSkeleton } from '../../components/assets/AssetDetailsSkeleton';
import { AssetDetailsTabs } from '../../components/assets/AssetDetailsTabs';
import { CriticalityPill } from '../../components/general/CriticalityPill';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';
import { RetryAlert } from '../../components/general/RetryAlert';
import { StatusPill } from '../../components/general/StatusPill';
import { ASSET_DETAILS_ERROR_DESCRIPTION, ASSET_DETAILS_ERROR_TITLE } from '../../constants/assets';
import { useAssetDetailsViewModel } from '../../hooks/assets/useAssetDetailsViewModel';
import { getStatusTone } from '../../lib/assetStatus';
import { getErrorReason } from '../../lib/errorReason';
import type { AssetIdentifier } from '../../types/asset';

type AssetDetailsProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDetails({ assetIdentifier }: AssetDetailsProps) {
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
  } = useAssetDetailsViewModel(assetIdentifier);

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
