import { IconChevronLeft, IconChevronRight, IconZoomIn, IconZoomOut } from '@tabler/icons-react';

import {
  PREVIEW_DEFAULT_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
  PREVIEW_ZOOM_STEP,
} from '../../../constants/documents';
import { PERCENT_FACTOR } from '../../../constants/number';
import { GeneralButton, IconActionButton } from '../../general';

const FIRST_PAGE = 1;

type DocumentPreviewControlsProps = {
  page: number;
  pageCount: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
};

export function DocumentPreviewControls({
  page,
  pageCount,
  zoom,
  onPageChange,
  onZoomChange,
}: DocumentPreviewControlsProps) {
  function handleZoomOut(): void {
    onZoomChange(Math.max(PREVIEW_MIN_ZOOM, zoom - PREVIEW_ZOOM_STEP));
  }

  function handleZoomIn(): void {
    onZoomChange(Math.min(PREVIEW_MAX_ZOOM, zoom + PREVIEW_ZOOM_STEP));
  }

  function handleZoomReset(): void {
    onZoomChange(PREVIEW_DEFAULT_ZOOM);
  }

  function handlePrevious(): void {
    onPageChange(page - 1);
  }

  function handleNext(): void {
    onPageChange(page + 1);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-2">
        <IconActionButton
          icon={<IconZoomOut aria-hidden className="size-4" />}
          isDisabled={zoom <= PREVIEW_MIN_ZOOM}
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
          isDisabled={zoom >= PREVIEW_MAX_ZOOM}
          label="Zoom in"
          onClick={handleZoomIn}
        />
      </div>
      {pageCount > FIRST_PAGE ? (
        <div className="flex items-center justify-center gap-3">
          <IconActionButton
            icon={<IconChevronLeft aria-hidden className="size-4" />}
            isDisabled={page <= FIRST_PAGE}
            label="Previous page"
            onClick={handlePrevious}
          />
          <span className="text-sm">
            Page {page} of {pageCount}
          </span>
          <IconActionButton
            icon={<IconChevronRight aria-hidden className="size-4" />}
            isDisabled={page >= pageCount}
            label="Next page"
            onClick={handleNext}
          />
        </div>
      ) : null}
    </div>
  );
}
