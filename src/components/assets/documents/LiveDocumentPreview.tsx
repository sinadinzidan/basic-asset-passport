import {
  IconChevronLeft,
  IconChevronRight,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';
import { useContext, useState } from 'react';

import type { DocumentAnnotation } from '../../../cognite-file-viewer/types';
import {
  PREVIEW_DEFAULT_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
  PREVIEW_ZOOM_STEP,
} from '../../../constants/documents';
import { LiveDocumentPreviewContext } from '../../../hooks/assets/documents/LiveDocumentPreviewContext';
import type { DocumentPreviewProps } from '../../../hooks/assets/documents/useDocumentPreview';
import { useOpenAsset } from '../../../hooks/assets/useOpenAsset';
import { GeneralButton } from '../../general/GeneralButton';
import { IconActionButton } from '../../general/IconActionButton';

import { LinkedAssetPopover, type LinkedAssetTarget } from './LinkedAssetPopover';

const FIRST_PAGE = 1;

/**
 * Previews a document with the signed-in client. The viewer reads the file
 * through CDF by its instance ID and highlights the diagram annotations of a
 * contextualised file, such as P&ID boxes; clicking a box that links to an
 * asset shows that asset and offers to open it in the register. Pages are stepped here because the
 * viewer shows one at a time, and the zoom is held here so the buttons and the
 * viewer's own pinch and Ctrl-wheel zoom stay in step.
 */
export function LiveDocumentPreview({ document }: DocumentPreviewProps) {
  const { useCogniteSdk, CogniteFileViewer } = useContext(
    LiveDocumentPreviewContext,
  );
  const client = useCogniteSdk();
  const [page, setPage] = useState(FIRST_PAGE);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(PREVIEW_DEFAULT_ZOOM);
  const [linkedTarget, setLinkedTarget] = useState<LinkedAssetTarget | null>(null);
  const openAsset = useOpenAsset();

  const hasSeveralPages = pageCount > FIRST_PAGE;
  const canGoToPrevious = page > FIRST_PAGE;
  const canGoToNext = page < pageCount;
  const canZoomOut = zoom > PREVIEW_MIN_ZOOM;
  const canZoomIn = zoom < PREVIEW_MAX_ZOOM;

  function handleDocumentLoad({ numPages }: { numPages: number }): void {
    setPageCount(numPages);
  }

  function handlePrevious(): void {
    changePage(page - 1);
  }

  function handleNext(): void {
    changePage(page + 1);
  }

  function handleAnnotationClick(
    annotation: DocumentAnnotation,
    anchor: Element,
  ): void {
    // Only an annotation that links to an asset has something to show.
    if (annotation.resourceType !== 'asset' || !annotation.linkedResource) return;
    setLinkedTarget({ asset: annotation.linkedResource, anchor });
  }

  function handleLinkedAssetClose(): void {
    setLinkedTarget(null);
  }

  // The popover points at a box on the page, which moves when the zoom or the page changes.
  function changeZoom(nextZoom: number): void {
    setLinkedTarget(null);
    setZoom(nextZoom);
  }

  function changePage(nextPage: number): void {
    setLinkedTarget(null);
    setPage(nextPage);
  }

  function handleZoomOut(): void {
    changeZoom(Math.max(PREVIEW_MIN_ZOOM, zoom - PREVIEW_ZOOM_STEP));
  }

  function handleZoomIn(): void {
    changeZoom(Math.min(PREVIEW_MAX_ZOOM, zoom + PREVIEW_ZOOM_STEP));
  }

  function handleZoomReset(): void {
    changeZoom(PREVIEW_DEFAULT_ZOOM);
  }

  return (
    <div className="flex flex-col gap-3">
      <CogniteFileViewer
        client={client}
        fitMode="width"
        maxZoom={PREVIEW_MAX_ZOOM}
        minZoom={PREVIEW_MIN_ZOOM}
        onAnnotationClick={handleAnnotationClick}
        onDocumentLoad={handleDocumentLoad}
        onPageChange={changePage}
        onZoomChange={changeZoom}
        page={page}
        showAnnotations
        source={{
          type: 'instanceId',
          space: document.space,
          externalId: document.externalId,
        }}
        style={{ width: '100%', height: '65vh' }}
        zoom={zoom}
      />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <IconActionButton
            icon={<IconZoomOut aria-hidden className="size-4" />}
            isDisabled={!canZoomOut}
            label="Zoom out"
            onClick={handleZoomOut}
          />
          <GeneralButton
            aria-label="Reset zoom"
            className="min-w-16"
            onClick={handleZoomReset}
            size="sm"
            variant="outline"
          >
            {Math.round(zoom * 100)}%
          </GeneralButton>
          <IconActionButton
            icon={<IconZoomIn aria-hidden className="size-4" />}
            isDisabled={!canZoomIn}
            label="Zoom in"
            onClick={handleZoomIn}
          />
        </div>
        {hasSeveralPages ? (
          <div className="flex items-center justify-center gap-3">
            <IconActionButton
              icon={<IconChevronLeft aria-hidden className="size-4" />}
              isDisabled={!canGoToPrevious}
              label="Previous page"
              onClick={handlePrevious}
            />
            <span className="text-sm">
              Page {page} of {pageCount}
            </span>
            <IconActionButton
              icon={<IconChevronRight aria-hidden className="size-4" />}
              isDisabled={!canGoToNext}
              label="Next page"
              onClick={handleNext}
            />
          </div>
        ) : null}
      </div>
      <LinkedAssetPopover
        target={linkedTarget}
        onClose={handleLinkedAssetClose}
        onOpenAsset={openAsset}
      />
    </div>
  );
}
