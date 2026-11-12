import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeaderContent,
  PopoverTitle,
} from '@cognite/aura/components/popover';

import {
  CRITICALITY_PROPERTY_IDENTIFIER,
  DESCRIPTION_PROPERTY_IDENTIFIER,
  NAME_PROPERTY_IDENTIFIER,
  PLANT_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
} from '../../../constants/assets';
import {
  LINKED_ASSET_ERROR_DESCRIPTION,
  LINKED_ASSET_ERROR_TITLE,
  LINKED_ASSET_LOADING_MESSAGE,
} from '../../../constants/documents';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetDetails } from '../../../hooks/assets/useAssetDetails';
import { getPropertyValue } from '../../../lib/assetProperties';
import { getStatusTone } from '../../../lib/assetStatus';
import { getErrorReason } from '../../../lib/errorReason';
import type { AssetIdentifier, AssetPropertyDisplay } from '../../../types/asset';
import { CriticalityPill } from '../../general/CriticalityPill';
import { GeneralButton } from '../../general/GeneralButton';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { StatusPill } from '../../general/StatusPill';
import { AssetProperties } from '../AssetProperties';

export type LinkedAssetTarget = {
  asset: AssetIdentifier;
  anchor: Element;
};

type LinkedAssetPopoverProps = {
  target: LinkedAssetTarget | null;
  onClose: () => void;

  onOpenAsset: ((asset: AssetIdentifier) => void) | null;
};

export function LinkedAssetPopover({ target, onClose, onOpenAsset }: LinkedAssetPopoverProps) {
  if (target === null) return null;

  return <OpenLinkedAssetPopover target={target} onClose={onClose} onOpenAsset={onOpenAsset} />;
}

const OUTSIDE_PRESS_REASON = 'outside-press';

type OpenLinkedAssetPopoverProps = Omit<LinkedAssetPopoverProps, 'target'> & {
  target: LinkedAssetTarget;
};

function OpenLinkedAssetPopover({ target, onClose, onOpenAsset }: OpenLinkedAssetPopoverProps) {
  const { asset, anchor } = target;
  const { data, error, isError, isFetching, isPending, refetch } = useAssetDetails(asset);

  const name = getPropertyValue(data, NAME_PROPERTY_IDENTIFIER);
  const status = getPropertyValue(data, STATUS_PROPERTY_IDENTIFIER);
  const criticality = getPropertyValue(data, CRITICALITY_PROPERTY_IDENTIFIER);
  const details: AssetPropertyDisplay[] = [
    {
      identifier: 'externalId',
      label: 'Functional location',
      value: asset.externalId,
    },
    ...[PLANT_PROPERTY_IDENTIFIER, DESCRIPTION_PROPERTY_IDENTIFIER].flatMap(
      (identifier) =>
        data?.properties.filter((property) => property.identifier === identifier) ?? [],
    ),
  ];

  function handleOpenChange(isOpen: boolean, eventDetails: { reason: string; event: Event }): void {
    if (isOpen) return;

    const isPressOnBox =
      eventDetails.reason === OUTSIDE_PRESS_REASON &&
      eventDetails.event.target instanceof Node &&
      anchor.contains(eventDetails.event.target);
    if (!isPressOnBox) onClose();
  }
  function handleOpenAsset(): void {
    onOpenAsset?.(asset);
  }
  function handleRetry(): void {
    void refetch();
  }

  return (
    <Popover open onOpenChange={handleOpenChange}>
      <PopoverContent
        align="start"
        anchor={anchor}
        className="hud-popover w-80 items-stretch gap-3"
      >
        <PopoverHeaderContent>
          <PopoverTitle className="min-w-0 whitespace-normal break-words font-display tracking-wide">
            {isPending || isError ? 'Linked asset' : (name ?? asset.externalId)}
          </PopoverTitle>
          <PopoverClose className="hud-button" />
        </PopoverHeaderContent>
        {isPending ? (
          <LoadingNotice
            message={LINKED_ASSET_LOADING_MESSAGE}
            variant={LoadingNoticeVariant.CARD}
          />
        ) : isError ? (
          <RetryAlert
            title={LINKED_ASSET_ERROR_TITLE}
            description={LINKED_ASSET_ERROR_DESCRIPTION}
            reason={getErrorReason(error)}
            isRetrying={isFetching}
            onRetry={handleRetry}
          />
        ) : (
          <>
            {status || criticality ? (
              <div className="flex flex-wrap items-center gap-2">
                {status ? <StatusPill status={status} tone={getStatusTone(status)} /> : null}
                {criticality ? <CriticalityPill criticality={criticality} /> : null}
              </div>
            ) : null}
            <AssetProperties properties={details} />
            {onOpenAsset ? (
              <GeneralButton className="self-start" onClick={handleOpenAsset} size="sm">
                Open asset
              </GeneralButton>
            ) : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
