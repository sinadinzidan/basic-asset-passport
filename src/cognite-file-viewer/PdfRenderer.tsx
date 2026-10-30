import type { PDFPageProxy } from 'pdfjs-dist';
import { useState, useLayoutEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { DefaultError, DefaultLoading } from './DefaultStates';
import { DocumentAnnotationOverlay } from './DocumentAnnotationOverlay';
import type { CogniteFileViewerProps } from './types';
import { useDocumentAnnotations } from './useDocumentAnnotations';
import { usePageDimensions, usePdfPageState } from './usePdfPageState';
import { useViewport, computeBaseWidth } from './useViewport';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDF_LOAD_ERROR = new Error('Failed to load PDF');

interface PdfRendererProps
  extends Omit<CogniteFileViewerProps, 'source' | 'className' | 'style' | 'renderUnsupported'> {
  url: string;
  instanceId?: { space: string; externalId: string };
}

export function PdfRenderer(props: PdfRendererProps) {
  const {
    url,
    instanceId,
    client,
    showAnnotations = true,
    onAnnotationClick,
    onAnnotationHover,
    renderAnnotationTooltip,
    page: controlledPage,
    onPageChange,
    onDocumentLoad,
    width,
    rotation = 0,
    fitMode,
    onLoadProgress,
    renderLoading,
    renderError,
    renderOverlay,
  } = props;

  // -- Hooks: viewport (zoom, pan, wheel, drag), page state, page size and annotations --
  const {
    currentZoom,
    effectivePan,
    containerDims,
    viewportRef,
    cursor,
    handleMouseDown,
    handlePanChange,
  } = useViewport(props);
  const { currentPage, handlePageChange } = usePdfPageState({ controlledPage, onPageChange, onPanChange: handlePanChange });
  const { pageDims, pageWrapperRef } = usePageDimensions();
  const { annotations, error: annotationError } = useDocumentAnnotations(
    client,
    instanceId,
    currentPage,
    { enabled: showAnnotations && instanceId !== undefined },
  );

  // -- Page natural dimensions (for fitMode='page') and the page the document callbacks see --
  const [pageNaturalSize, setPageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const currentPageRef = useRef(currentPage);

  const baseWidth = computeBaseWidth(fitMode, width, containerDims, pageNaturalSize);
  const annotationsEnabled = showAnnotations && instanceId !== undefined;
  const loading = renderLoading ? renderLoading() : <DefaultLoading />;
  const loadError = renderError ? renderError(PDF_LOAD_ERROR) : <DefaultError error={PDF_LOAD_ERROR} />;

  const handlePageLoadSuccess = useCallback((page: PDFPageProxy) => {
    const { width: w, height: h } = page.getViewport({ scale: 1 });
    if (w && h) setPageNaturalSize({ width: w, height: h });
  }, []);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      onDocumentLoad?.({ numPages });
      if (currentPageRef.current > numPages) handlePageChange(1);
    },
    [onDocumentLoad, handlePageChange],
  );

  useLayoutEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  return (
    <div
      ref={viewportRef}
      className={currentZoom > 1 ? 'h-full overflow-hidden' : 'h-full overflow-auto'}
      style={{ cursor }}
      onMouseDown={handleMouseDown}
    >
      {annotationError && <div role="alert">Diagram annotations could not be loaded: {annotationError.message}. The diagram is still available.</div>}
      <Document
        file={url}
        onLoadSuccess={handleLoadSuccess}
        onLoadProgress={onLoadProgress}
        loading={loading}
        error={loadError}
      >
        <div
          ref={pageWrapperRef}
          className="relative inline-block"
          style={{
            transform: effectivePan.x !== 0 || effectivePan.y !== 0
              ? `translate(${effectivePan.x}px, ${effectivePan.y}px)`
              : undefined,
          }}
        >
          <Page
            pageNumber={currentPage}
            width={baseWidth}
            scale={currentZoom}
            rotate={rotation}
            onLoadSuccess={handlePageLoadSuccess}
            loading={loading}
            error={loadError}
          />
          {annotationsEnabled && pageDims.width > 0 && annotations.length > 0 && (
            <DocumentAnnotationOverlay
              annotations={annotations}
              containerWidth={pageDims.width}
              containerHeight={pageDims.height}
              rotation={rotation}
              onAnnotationClick={onAnnotationClick}
              onAnnotationHover={onAnnotationHover}
              renderAnnotationTooltip={renderAnnotationTooltip}
            />
          )}
          {renderOverlay && pageDims.width > 0 && pageDims.height > 0 && pageNaturalSize && (
            renderOverlay({
              width: pageDims.width,
              height: pageDims.height,
              originalWidth: pageNaturalSize.width,
              originalHeight: pageNaturalSize.height,
              pageNumber: currentPage,
              rotation,
            })
          )}
        </div>
      </Document>
    </div>
  );
}
