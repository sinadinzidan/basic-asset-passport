import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconArrowLeft } from '@tabler/icons-react';

import { AssetDetailsTabs } from '../../components/assets/AssetDetailsTabs';
import { LoadingNotice } from '../../components/general/LoadingNotice';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';
import { RetryAlert } from '../../components/general/RetryAlert';
import { StatusPill } from '../../components/general/StatusPill';
import {
  CRITICALITY_PROPERTY_IDENTIFIER,
  NAME_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
} from '../../constants/assets';
import type { AssetEquipmentTab } from '../../enums/assetEquipmentTab';
import { useAssetEquipmentDetails } from '../../hooks/assets/useAssetEquipmentDetails';
import { getPropertyValue } from '../../lib/assetProperties';
import { isOperatingStatus } from '../../lib/assetStatus';
import type { AssetIdentifier } from '../../types/asset';

type AssetEquipmentRegisterProps = {
  assetIdentifier: AssetIdentifier;
  activeTab: AssetEquipmentTab;
  onTabChange: (tab: AssetEquipmentTab) => void;
  onBack: () => void;
};

export function AssetEquipmentRegister({
  assetIdentifier,
  activeTab,
  onTabChange,
  onBack,
}: AssetEquipmentRegisterProps) {
  const { data, isError, isFetching, isPending, refetch } =
    useAssetEquipmentDetails(assetIdentifier);

  const assetName = getPropertyValue(data?.asset, NAME_PROPERTY_IDENTIFIER);
  const assetStatus = getPropertyValue(data?.asset, STATUS_PROPERTY_IDENTIFIER);
  const assetCriticality = getPropertyValue(
    data?.asset,
    CRITICALITY_PROPERTY_IDENTIFIER,
  );
  const backButton = (
    <Button
      aria-label="Back to assets"
      onClick={onBack}
      size="icon-lg"
      variant="outline"
    >
      <IconArrowLeft aria-hidden />
    </Button>
  );

  function handleRetry(): void {
    void refetch();
  }

  if (isPending) {
    return (
      <PageShell>
        <LoadingNotice
          className="p-10"
          message="Loading asset and equipment properties..."
        />
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        {backButton}
        <RetryAlert
          title="Asset details could not be loaded"
          description="Check access to the Asset and Equipment views, then try again."
          isRetrying={isFetching}
          onRetry={handleRetry}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={assetName ?? data.asset.externalId}
        leading={backButton}
        badges={
          <>
            {assetStatus ? (
              <StatusPill
                status={assetStatus}
                tone={isOperatingStatus(assetStatus) ? 'success' : 'neutral'}
              />
            ) : null}
            {assetCriticality ? (
              <Badge className="h-7 rounded-full px-3" variant="secondary">
                Criticality {assetCriticality}
              </Badge>
            ) : null}
          </>
        }
      />
      <AssetDetailsTabs
        details={data}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </PageShell>
  );
}
