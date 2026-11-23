import {
  THREE_D_ERROR_DESCRIPTION,
  THREE_D_ERROR_TITLE,
  THREE_D_LOADING_MESSAGE,
  THREE_D_NOT_FOUND_DESCRIPTION,
  THREE_D_NOT_FOUND_TITLE,
  THREE_D_VIEWPORT_LABEL,
} from '../../../constants/threeD';
import { LoadingNoticeVariant } from '../../../enums/loadingNoticeVariant';
import { useAssetThreeDViewModel } from '../../../hooks/three-d/view-models/useAssetThreeDViewModel';
import { getErrorReason } from '../../../lib/errorReason';
import {
  formatThreeDProgress,
  formatUnsupportedShapes,
  isThreeDLoadingDone,
} from '../../../lib/three-d/progressMessage';
import { EmptyStateMessage, LoadingNotice, RetryAlert } from '../../general';

export function AssetThreeD() {
  const {
    error,
    hasModel,
    isError,
    isLoading,
    isNotFound,
    modelName,
    progress,
    retry,
    viewportRef,
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

  if (isNotFound || !hasModel) {
    return (
      <EmptyStateMessage
        title={THREE_D_NOT_FOUND_TITLE}
        description={THREE_D_NOT_FOUND_DESCRIPTION}
      />
    );
  }

  const unsupported = formatUnsupportedShapes(progress);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={viewportRef}
        role="img"
        aria-label={`${THREE_D_VIEWPORT_LABEL}: ${modelName}`}
        className="data-card relative h-[60vh] min-h-96 w-full overflow-hidden"
      />
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
