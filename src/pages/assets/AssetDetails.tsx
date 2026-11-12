import { AssetDetailsSkeleton } from '../../components/assets/AssetDetailsSkeleton';
import { AssetDetailsTabs } from '../../components/assets/AssetDetailsTabs';
import { CriticalityPill } from '../../components/general/CriticalityPill';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';
import { RetryAlert } from '../../components/general/RetryAlert';
import { StatusPill } from '../../components/general/StatusPill';
import {
  CRITICALITY_PROPERTY_IDENTIFIER,
  NAME_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
} from '../../constants/assets';
import { useAssetDetails } from '../../hooks/assets/useAssetDetails';
import { useAssetDetailsTabCounts } from '../../hooks/assets/useAssetDetailsTabCounts';
import { getPropertyValue } from '../../lib/assetProperties';
import { getStatusTone } from '../../lib/assetStatus';
import type { AssetIdentifier } from '../../types/asset';

type AssetDetailsProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDetails({ assetIdentifier }: AssetDetailsProps) {
  const { data, isError, isFetching, isPending, refetch } = useAssetDetails(assetIdentifier);

  const tabCounts = useAssetDetailsTabCounts(assetIdentifier);

  const assetName = getPropertyValue(data, NAME_PROPERTY_IDENTIFIER);
  const assetStatus = getPropertyValue(data, STATUS_PROPERTY_IDENTIFIER);
  const assetCriticality = getPropertyValue(data, CRITICALITY_PROPERTY_IDENTIFIER);

  function handleRetry(): void {
    void refetch();
  }

  if (isPending) {
    return (
      <PageShell>
        <AssetDetailsSkeleton />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <RetryAlert
          title="Asset details could not be loaded"
          description="Check access to the Asset view, then try again."
          isRetrying={isFetching}
          onRetry={handleRetry}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Asset passport"
        title={assetName ?? data.externalId}
        badges={
          <>
            {assetStatus ? (
              <StatusPill status={assetStatus} tone={getStatusTone(assetStatus)} />
            ) : null}
            {assetCriticality ? <CriticalityPill criticality={assetCriticality} /> : null}
          </>
        }
      />
      <AssetDetailsTabs asset={data} tabCounts={tabCounts} />
    </PageShell>
  );
}
