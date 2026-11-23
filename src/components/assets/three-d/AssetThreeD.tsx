import { IconFocusCentered, IconZoomIn, IconZoomOut } from '@tabler/icons-react';

import {
  THREE_D_ERROR_DESCRIPTION,
  THREE_D_ERROR_TITLE,
  THREE_D_LOADING_MESSAGE,
  THREE_D_RESET_VIEW_LABEL,
  THREE_D_VIEWPORT_LABEL,
  THREE_D_ZOOM_IN_LABEL,
  THREE_D_ZOOM_OUT_LABEL,
} from '../../../constants/threeD';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
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
    isError,
    isLoading,
    modelName,
    progress,
    resetView,
    retry,
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
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
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
