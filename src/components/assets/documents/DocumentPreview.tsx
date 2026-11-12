import { useCogniteSdk } from '@cognite/app-sdk/react';
import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from '@tabler/icons-react';
import { useContext, useState } from 'react';

import type { DocumentAnnotation } from '../../../cognite-file-viewer/types';
import { ASSET_RESOURCE_TYPE } from '../../../constants/cdfApi';
import {
  PREVIEW_DEFAULT_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
  PREVIEW_ZOOM_STEP,
} from '../../../constants/documents';
import { PERCENT_FACTOR } from '../../../constants/number';
import type { DocumentPreviewProps } from '../../../hooks/assets/documents/useDocumentPreview';
import { useNavigationState } from '../../../hooks/general/useNavigationState';
import { GeneralButton, IconActionButton } from '../../general';

import { DocumentViewerContext } from './documentViewerContext';
import { LinkedAssetPopover, type LinkedAssetTarget } from './LinkedAssetPopover';

const FIRST_PAGE = 1;

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const client = useCogniteSdk();
  const { CogniteFileViewer } = useContext(DocumentViewerContext);
  const openAsset = useNavigationState((store) => store.actions.selectAsset);

  const [page, setPage] = useState(FIRST_PAGE);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(PREVIEW_DEFAULT_ZOOM);
  const [linkedTarget, setLinkedTarget] = useState<LinkedAssetTarget | null>(null);

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

  function handleAnnotationClick(annotation: DocumentAnnotation, anchor: Element): void {
    if (annotation.resourceType !== ASSET_RESOURCE_TYPE || !annotation.linkedResource) return;
    setLinkedTarget({ asset: annotation.linkedResource, anchor });
  }

  function handleLinkedAssetClose(): void {
    setLinkedTarget(null);
  }

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
        className="h-[65vh] w-full"
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
            {Math.round(zoom * PERCENT_FACTOR)}%
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
