import {
  IconArrowsMove,
  IconFocusCentered,
  IconRotate3d,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';

import {
  THREE_D_ERROR_DESCRIPTION,
  THREE_D_ERROR_TITLE,
  THREE_D_LABEL_OFFSET_PX,
  THREE_D_LOADING_MESSAGE,
  THREE_D_MOVE_LABEL,
  THREE_D_ORBIT_LABEL,
  THREE_D_RESET_VIEW_LABEL,
  THREE_D_VIEWPORT_LABEL,
  THREE_D_ZOOM_IN_LABEL,
  THREE_D_ZOOM_OUT_LABEL,
} from '../../../constants/threeD';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { ThreeDInteractionMode } from '../../../enums/threeDInteractionMode';
import { useAssetThreeDViewModel } from '../../../hooks/three-d/view-models/useAssetThreeDViewModel';
import { getErrorReason } from '../../../lib/errorReason';
import {
  formatThreeDProgress,
  formatUnsupportedShapes,
  isThreeDLoadingDone,
} from '../../../lib/three-d/progressMessage';
import { IconActionButton, LoadingNotice, RetryAlert } from '../../general';

export function AssetThreeD() {
  const {
    error,
    hasModel,
    hover,
    interactionMode,
    isError,
    isLoading,
    modelName,
    progress,
    resetView,
    retry,
    setInteractionMode,
    viewportRef,
    zoomIn,
    zoomOut,
  } = useAssetThreeDViewModel();

  if (isLoading) {
    return (
      <LoadingNotice
        className="p-6"
        message={THREE_D_LOADING_MESSAGE}
        variant={LoadingNoticeVariant.CARD}
      />
    );
  }

  if (isError) {
    return (
      <RetryAlert
        title={THREE_D_ERROR_TITLE}
        description={THREE_D_ERROR_DESCRIPTION}
        reason={getErrorReason(error)}
        isRetrying={false}
        onRetry={retry}
      />
    );
  }

  if (!hasModel) return null;

  const unsupported = formatUnsupportedShapes(progress);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          ref={viewportRef}
          role="img"
          aria-label={`${THREE_D_VIEWPORT_LABEL}: ${modelName}`}
          className="data-card relative h-[60vh] min-h-96 w-full overflow-hidden"
        />
        {hover ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 rounded-sm border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
            style={{
              left: hover.x,
              top: hover.y,
              transform: `translate(${THREE_D_LABEL_OFFSET_PX}px, ${THREE_D_LABEL_OFFSET_PX}px)`,
            }}
          >
            {hover.name}
          </div>
        ) : null}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <IconActionButton
            label={THREE_D_ORBIT_LABEL}
            icon={<IconRotate3d aria-hidden className="size-4" />}
            isPressed={interactionMode === ThreeDInteractionMode.ORBIT}
            onClick={() => setInteractionMode(ThreeDInteractionMode.ORBIT)}
          />
          <IconActionButton
            label={THREE_D_MOVE_LABEL}
            icon={<IconArrowsMove aria-hidden className="size-4" />}
            isPressed={interactionMode === ThreeDInteractionMode.MOVE}
            onClick={() => setInteractionMode(ThreeDInteractionMode.MOVE)}
          />
          <IconActionButton
            label={THREE_D_ZOOM_IN_LABEL}
            icon={<IconZoomIn aria-hidden className="size-4" />}
            onClick={zoomIn}
          />
          <IconActionButton
            label={THREE_D_ZOOM_OUT_LABEL}
            icon={<IconZoomOut aria-hidden className="size-4" />}
            onClick={zoomOut}
          />
          <IconActionButton
            label={THREE_D_RESET_VIEW_LABEL}
            icon={<IconFocusCentered aria-hidden className="size-4" />}
            onClick={resetView}
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {modelName} · {formatThreeDProgress(progress)}
        {isThreeDLoadingDone(progress) ? ' · loaded' : ' · loading'}
      </p>
      {unsupported ? (
        <p className="text-xs text-muted-foreground">Unsupported shapes skipped: {unsupported}</p>
      ) : null}
    </div>
  );
}
