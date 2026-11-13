import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeaderContent,
  PopoverTitle,
} from '@cognite/aura/components/popover';

import {
  ANNOTATED_ASSET_ERROR_DESCRIPTION,
  ANNOTATED_ASSET_ERROR_TITLE,
  ANNOTATED_ASSET_LOADING_MESSAGE,
  ANNOTATED_ASSET_PENDING_TITLE,
} from '../../../constants/documents';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAnnotatedAssetViewModel } from '../../../hooks/assets/documents/view-models/useAnnotatedAssetViewModel';
import { getStatusTone } from '../../../lib/assetStatus';
import { getErrorReason } from '../../../lib/errorReason';
import type { AssetIdentifier } from '../../../types/asset';
import { GeneralButton, LoadingNotice, PropertyGrid, RetryAlert, StatusPill } from '../../general';
import { CriticalityPill } from '../CriticalityPill';

export type AnnotatedAssetTarget = {
  asset: AssetIdentifier;
  anchor: Element;
};

type AnnotatedAssetPopoverProps = {
  target: AnnotatedAssetTarget | null;
  onClose: () => void;
  onOpenAsset: (asset: AssetIdentifier) => void;
};

export function AnnotatedAssetPopover({
  target,
  onClose,
  onOpenAsset,
}: AnnotatedAssetPopoverProps) {
  if (target === null) return null;

  return <OpenAnnotatedAssetPopover target={target} onClose={onClose} onOpenAsset={onOpenAsset} />;
}

const OUTSIDE_PRESS_REASON = 'outside-press';

type OpenAnnotatedAssetPopoverProps = Omit<AnnotatedAssetPopoverProps, 'target'> & {
  target: AnnotatedAssetTarget;
};

function OpenAnnotatedAssetPopover({
  target,
  onClose,
  onOpenAsset,
}: OpenAnnotatedAssetPopoverProps) {
  const { asset, anchor } = target;
  const { title, status, criticality, details, error, isError, isFetching, isPending, retry } =
    useAnnotatedAssetViewModel(asset);

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
            {isPending || isError ? ANNOTATED_ASSET_PENDING_TITLE : title}
          </PopoverTitle>
          <PopoverClose className="hud-button" />
        </PopoverHeaderContent>
        {isPending ? (
          <LoadingNotice
            message={ANNOTATED_ASSET_LOADING_MESSAGE}
            variant={LoadingNoticeVariant.CARD}
          />
        ) : isError ? (
          <RetryAlert
            title={ANNOTATED_ASSET_ERROR_TITLE}
            description={ANNOTATED_ASSET_ERROR_DESCRIPTION}
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
            <PropertyGrid properties={details} />
            <GeneralButton className="self-start" onClick={handleOpenAsset} size="sm">
              Open asset
            </GeneralButton>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
