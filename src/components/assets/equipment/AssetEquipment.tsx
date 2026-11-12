import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetEquipment } from '../../../hooks/assets/equipment/useAssetEquipment';
import { formatCount } from '../../../lib/countBadge';
import { getInstanceKey } from '../../../lib/instanceKey';
import type { AssetIdentifier } from '../../../types/asset';
import { AppAlert } from '../../general/AppAlert';
import { EmptyStateMessage } from '../../general/EmptyStateMessage';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { EquipmentDetails } from '../EquipmentDetails';

type AssetEquipmentProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetEquipment({ assetIdentifier }: AssetEquipmentProps) {
  const { data, isError, isFetching, isPending, refetch } = useAssetEquipment(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message="Loading equipment..."
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title="Equipment could not be loaded"
        description="Check access to the Equipment view, then try again."
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyStateMessage
        title="No equipment linked"
        description="There are no Equipment instances linked to this asset."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.hasMore ? (
        <AppAlert variant={AppAlertVariant.INFO}>
          Showing the first {formatCount(data.items.length)} equipment, sorted by name. This asset
          has more.
        </AppAlert>
      ) : null}
      {data.items.map((equipment) => (
        <EquipmentDetails key={getInstanceKey(equipment)} equipment={equipment} />
      ))}
    </div>
  );
}
