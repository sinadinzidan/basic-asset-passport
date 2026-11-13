import {
  EQUIPMENT_EMPTY_DESCRIPTION,
  EQUIPMENT_EMPTY_TITLE,
  EQUIPMENT_ERROR_DESCRIPTION,
  EQUIPMENT_ERROR_TITLE,
  EQUIPMENT_LOADING_MESSAGE,
} from '../../../constants/assets';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetEquipmentViewModel } from '../../../hooks/assets/equipment/useAssetEquipmentViewModel';
import { formatEquipmentTruncatedMessage } from '../../../lib/assetMessage';
import { getErrorReason } from '../../../lib/errorReason';
import { getInstanceKey } from '../../../lib/instanceKey';
import { AppAlert, EmptyStateMessage, LoadingNotice, RetryAlert } from '../../general';
import { EquipmentDetails } from '../EquipmentDetails';

export function AssetEquipment() {
  const { equipment, hasMore, error, isError, isFetching, isPending, retry } =
    useAssetEquipmentViewModel();

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
        onRetry={retry}
      />
    );
  }

  if (equipment.length === 0) {
    return (
      <EmptyStateMessage title={EQUIPMENT_EMPTY_TITLE} description={EQUIPMENT_EMPTY_DESCRIPTION} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {hasMore ? (
        <AppAlert variant={AppAlertVariant.INFO}>
          {formatEquipmentTruncatedMessage(equipment.length)}
        </AppAlert>
      ) : null}
      {equipment.map((item) => (
        <EquipmentDetails key={getInstanceKey(item)} equipment={item} />
      ))}
    </div>
  );
}
