import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeaderContent,
  PopoverTitle,
} from '@cognite/aura/components/popover';

import {
  LINKED_ASSET_ERROR_DESCRIPTION,
  LINKED_ASSET_ERROR_TITLE,
  LINKED_ASSET_LOADING_MESSAGE,
  LINKED_ASSET_PENDING_TITLE,
} from '../../../constants/documents';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useLinkedAssetViewModel } from '../../../hooks/assets/documents/useLinkedAssetViewModel';
import { getStatusTone } from '../../../lib/assetStatus';
import { getErrorReason } from '../../../lib/errorReason';
import type { AssetIdentifier } from '../../../types/asset';
import {
  CriticalityPill,
  GeneralButton,
  LoadingNotice,
  RetryAlert,
  StatusPill,
} from '../../general';
import { AssetProperties } from '../AssetProperties';

export type LinkedAssetTarget = {
  asset: AssetIdentifier;
  anchor: Element;
};

type LinkedAssetPopoverProps = {
  target: LinkedAssetTarget | null;
  onClose: () => void;
  onOpenAsset: (asset: AssetIdentifier) => void;
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
  const { title, status, criticality, details, error, isError, isFetching, isPending, retry } =
    useLinkedAssetViewModel(asset);

  function handleOpenChange(isOpen: boolean, eventDetails: { reason: string; event: Event }): void {
    if (isOpen) return;

    const isPressOnBox =
      eventDetails.reason === OUTSIDE_PRESS_REASON &&
      eventDetails.event.target instanceof Node &&
      anchor.contains(eventDetails.event.target);
    if (!isPressOnBox) onClose();
  }
  function handleOpenAsset(): void {
    onOpenAsset(asset);
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
            {isPending || isError ? LINKED_ASSET_PENDING_TITLE : title}
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
            onRetry={retry}
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
            <GeneralButton className="self-start" onClick={handleOpenAsset} size="sm">
              Open asset
            </GeneralButton>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
