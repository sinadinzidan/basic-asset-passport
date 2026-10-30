import type { SyntheticEvent } from 'react';
import { useCallback, useState } from 'react';

import { DEFAULT_IMAGE_ALT, IMAGE_FALLBACK_SIZE, ROTATION_QUARTER_TURN_DEGREES, ROTATION_THREE_QUARTER_TURN_DEGREES } from '../constants/fileViewer';

import { DefaultError, DefaultLoading } from './DefaultStates';
import type { CogniteFileViewerProps } from './types';
import { useBlobUrl } from './useBlobUrl';
import { useViewport, computeBaseWidth } from './useViewport';

interface ImageRendererProps
  extends Omit<CogniteFileViewerProps, 'source' | 'client' | 'className' | 'style'> {
  url: string;
}

export function ImageRenderer(props: ImageRendererProps) {
  const { url, alt = DEFAULT_IMAGE_ALT, rotation = 0, fitMode, width: explicitWidth, renderLoading, renderError, renderOverlay } = props;
  const { currentZoom, effectivePan, containerDims, viewportRef, cursor, handleMouseDown } = useViewport(props);
  const { blobUrl, error } = useBlobUrl(url);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imageError, setImageError] = useState<Error | null>(null);

  const failure = error ?? imageError;

  const handleLoad = useCallback((e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize(naturalWidth > 0 && naturalHeight > 0 ? { width: naturalWidth, height: naturalHeight } : IMAGE_FALLBACK_SIZE);
  }, []);

  if (failure) return renderError ? renderError(failure) : <DefaultError error={failure} />;
  if (!blobUrl) return renderLoading ? renderLoading() : <DefaultLoading />;

  const baseWidth = computeBaseWidth(fitMode, explicitWidth, containerDims, naturalSize);
  const imgWidth = baseWidth ?? naturalSize?.width;

  // Until we know image dimensions, render hidden to measure
  if (!imgWidth || !naturalSize) {
    return (
      <div ref={viewportRef} className="overflow-hidden">
        {renderLoading ? renderLoading() : <DefaultLoading />}
        <img
          src={blobUrl}
          alt=""
          className="pointer-events-none invisible absolute"
          onLoad={handleLoad}
          onError={() => setImageError(new Error('Failed to display image.'))}
        />
      </div>
    );
  }

  const imgHeight = imgWidth * (naturalSize.height / naturalSize.width);
  const isSwapped = rotation === ROTATION_QUARTER_TURN_DEGREES || rotation === ROTATION_THREE_QUARTER_TURN_DEGREES;
  const visualW = (isSwapped ? imgHeight : imgWidth) * currentZoom;
  const visualH = (isSwapped ? imgWidth : imgHeight) * currentZoom;

  return (
    <div ref={viewportRef} className={currentZoom > 1 ? 'overflow-hidden' : 'overflow-auto'} style={{ cursor }} onMouseDown={handleMouseDown}>
      <div
        className="inline-block"
        style={{
          transform:
            effectivePan.x !== 0 || effectivePan.y !== 0
              ? `translate(${effectivePan.x}px, ${effectivePan.y}px)`
              : undefined,
        }}
      >
        <div className="relative" style={{ width: visualW, height: visualH }}>
          <img
            src={blobUrl}
            alt={alt}
            className="absolute top-1/2 left-1/2"
            style={{
              width: imgWidth * currentZoom,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }}
            onLoad={handleLoad}
            onError={() => setImageError(new Error('Failed to display image.'))}
          />
          {renderOverlay && naturalSize && (
            renderOverlay({
              width: visualW,
              height: visualH,
              originalWidth: naturalSize.width,
              originalHeight: naturalSize.height,
              pageNumber: 1,
              rotation,
            })
          )}
        </div>
      </div>
    </div>
  );
}
