import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useContext, useState } from 'react';

import type { DocumentAnnotation } from '../../../cognite-file-viewer/types';
import { ASSET_RESOURCE_TYPE } from '../../../constants/cdfApi';
import {
  PREVIEW_DEFAULT_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
} from '../../../constants/documents';
import type { DocumentPreviewProps } from '../../../hooks/assets/documents/useDocumentPreviewRenderer';
import { useNavigationState } from '../../../hooks/general/useNavigationState';

import { AnnotatedAssetPopover, type AnnotatedAssetTarget } from './AnnotatedAssetPopover';
import { DocumentPreviewControls } from './DocumentPreviewControls';
import { DocumentViewerContext } from './documentViewerContext';

const FIRST_PAGE = 1;

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const client = useCogniteSdk();
  const { CogniteFileViewer } = useContext(DocumentViewerContext);
  const openAsset = useNavigationState((store) => store.actions.selectAsset);

  const [page, setPage] = useState(FIRST_PAGE);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(PREVIEW_DEFAULT_ZOOM);
  const [linkedTarget, setLinkedTarget] = useState<AnnotatedAssetTarget | null>(null);

  function handleDocumentLoad({ numPages }: { numPages: number }): void {
    setPageCount(numPages);
  }

  function handleAnnotationClick(annotation: DocumentAnnotation, anchor: Element): void {
    if (annotation.resourceType !== ASSET_RESOURCE_TYPE || !annotation.linkedResource) return;

    setLinkedTarget({ asset: annotation.linkedResource, anchor });
  }

  function handleAnnotatedAssetClose(): void {
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
      <DocumentPreviewControls
        page={page}
        pageCount={pageCount}
        zoom={zoom}
        onPageChange={changePage}
        onZoomChange={changeZoom}
      />
      <AnnotatedAssetPopover
        target={linkedTarget}
        onClose={handleAnnotatedAssetClose}
        onOpenAsset={openAsset}
      />
    </div>
  );
}
