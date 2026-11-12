import {
  EQUIPMENT_EMPTY_DESCRIPTION,
  EQUIPMENT_EMPTY_TITLE,
  EQUIPMENT_ERROR_DESCRIPTION,
  EQUIPMENT_ERROR_TITLE,
  EQUIPMENT_LOADING_MESSAGE,
} from '../../../constants/assets';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetEquipment } from '../../../hooks/assets/equipment/useAssetEquipment';
import { formatEquipmentTruncatedMessage } from '../../../lib/assetMessage';
import { getErrorReason } from '../../../lib/errorReason';
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
  const { data, error, isError, isFetching, isPending, refetch } =
    useAssetEquipment(assetIdentifier);

  function handleRetry(): void {
    void refetch();
  }

  if (isPending) {
    return (
      <LoadingNotice
        className="p-6"
        message={EQUIPMENT_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title={EQUIPMENT_ERROR_TITLE}
        description={EQUIPMENT_ERROR_DESCRIPTION}
        reason={getErrorReason(error)}
        isRetrying={isFetching}
        onRetry={handleRetry}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <EmptyStateMessage title={EQUIPMENT_EMPTY_TITLE} description={EQUIPMENT_EMPTY_DESCRIPTION} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {data.hasMore ? (
        <AppAlert variant={AppAlertVariant.INFO}>
          {formatEquipmentTruncatedMessage(data.items.length)}
        </AppAlert>
      ) : null}
      {data.items.map((equipment) => (
        <EquipmentDetails key={getInstanceKey(equipment)} equipment={equipment} />
      ))}
    </div>
  );
}
