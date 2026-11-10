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
import { useAssetEquipmentDetails } from '../../../hooks/assets/useAssetEquipmentDetails';
import { getPropertyValue } from '../../../lib/assetProperties';
import { getStatusTone } from '../../../lib/assetStatus';
import type {
  AssetIdentifier,
  AssetPropertyDisplay,
} from '../../../types/asset';
import { CriticalityPill } from '../../general/CriticalityPill';
import { GeneralButton } from '../../general/GeneralButton';
import { LoadingNotice } from '../../general/LoadingNotice';
import { RetryAlert } from '../../general/RetryAlert';
import { StatusPill } from '../../general/StatusPill';
import { AssetProperties } from '../AssetProperties';

/** The asset a clicked annotation links to, and the annotation box the popover points at. */
export type LinkedAssetTarget = {
  asset: AssetIdentifier;
  anchor: Element;
};

type LinkedAssetPopoverProps = {
  /** Null while no annotation is clicked. */
  target: LinkedAssetTarget | null;
  onClose: () => void;
  /** Opens the asset in the register; null where the app cannot, which leaves only the details. */
  onOpenAsset: ((asset: AssetIdentifier) => void) | null;
};

/**
 * What a diagram annotation links to, in a popover at the clicked box, with a
 * way to open that asset in the register.
 */
export function LinkedAssetPopover({
  target,
  onClose,
  onOpenAsset,
}: LinkedAssetPopoverProps) {
  if (target === null) return null;

  return (
    <OpenLinkedAssetPopover
      target={target}
      onClose={onClose}
      onOpenAsset={onOpenAsset}
    />
  );
}

type OpenLinkedAssetPopoverProps = Omit<LinkedAssetPopoverProps, 'target'> & {
  target: LinkedAssetTarget;
};

function OpenLinkedAssetPopover({
  target,
  onClose,
  onOpenAsset,
}: OpenLinkedAssetPopoverProps) {
  const { asset, anchor } = target;
  const { data, isError, isFetching, isPending, refetch } =
    useAssetEquipmentDetails(asset);

  const name = getPropertyValue(data?.asset, NAME_PROPERTY_IDENTIFIER);
  const status = getPropertyValue(data?.asset, STATUS_PROPERTY_IDENTIFIER);
  const criticality = getPropertyValue(
    data?.asset,
    CRITICALITY_PROPERTY_IDENTIFIER,
  );
  const details: AssetPropertyDisplay[] = [
    {
      identifier: 'externalId',
      label: 'Functional location',
      value: asset.externalId,
    },
    ...[PLANT_PROPERTY_IDENTIFIER, DESCRIPTION_PROPERTY_IDENTIFIER].flatMap(
      (identifier) =>
        data?.asset.properties.filter(
          (property) => property.identifier === identifier,
        ) ?? [],
    ),
  ];

  function handleOpenChange(
    isOpen: boolean,
    details: { reason: string; event: Event },
  ): void {
    if (isOpen) return;
    // The click that opens the popover is also a press on the box it points at, which must not close it.
    const isPressOnBox =
      details.reason === 'outside-press' &&
      details.event.target instanceof Node &&
      anchor.contains(details.event.target);
    if (!isPressOnBox) onClose();
  }

  function handleOpenAsset(): void {
    onOpenAsset?.(asset);
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
          <LoadingNotice message="Loading asset..." variant="CARD" />
        ) : isError ? (
          <RetryAlert
            title="Asset could not be loaded"
            description="Check that the linked item is an asset in the register and that you can read it, then try again."
            isRetrying={isFetching}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            {status || criticality ? (
              <div className="flex flex-wrap items-center gap-2">
                {status ? (
                  <StatusPill status={status} tone={getStatusTone(status)} />
                ) : null}
                {criticality ? (
                  <CriticalityPill criticality={criticality} />
                ) : null}
              </div>
            ) : null}
            <AssetProperties properties={details} />
            {onOpenAsset ? (
              <GeneralButton
                className="self-start"
                onClick={handleOpenAsset}
                size="sm"
              >
                Open asset
              </GeneralButton>
            ) : null}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
