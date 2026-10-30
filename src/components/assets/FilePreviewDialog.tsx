import { Button } from '@cognite/aura/components/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@cognite/aura/components/dialog';
import type { CogniteClient } from '@cognite/sdk';
import { IconChevronLeft, IconChevronRight, IconFileDescription, IconLock, IconMaximize, IconMinus, IconPlus, IconX } from '@tabler/icons-react';
import type { ComponentType } from 'react';
import { lazy, Suspense, useState } from 'react';

import type { CogniteFileViewerProps } from '../../cognite-file-viewer/types';
import { FILE_VIEWER_MAX_ZOOM, FILE_VIEWER_MIN_ZOOM, FILE_VIEWER_ZOOM_STEP } from '../../constants/fileViewer';
import { ICON_SIZE_CAPTION_PX, PERCENT_FACTOR } from '../../constants/ui';
import type { FileSelection } from '../../types/asset';
import { LoadingNotice } from '../general/LoadingNotice';
import { RetryAlert } from '../general/RetryAlert';

const CogniteFileViewer = lazy(() => import('../../cognite-file-viewer/CogniteFileViewer').then(
  (module) => ({ default: module.CogniteFileViewer })
));

type FilePreviewDialogProps = {
  file: FileSelection;
  client: CogniteClient;
  onClose: () => void;
  Viewer?: ComponentType<CogniteFileViewerProps>;
};

export function FilePreviewDialog({ file, client, onClose, Viewer = CogniteFileViewer }: FilePreviewDialogProps) {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [attempt, setAttempt] = useState(0);

  function handleRetry(): void {
    setPage(1);
    setNumPages(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAttempt((previous: number) => previous + 1);
  }

  return (
    <Dialog open onOpenChange={(isOpen: boolean) => { if (!isOpen) onClose(); }}>
      <DialogContent className="flex h-[90dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl" showCloseButton={false}>
        <DialogHeader className="flex-row items-start gap-3 border-b border-border p-4">
          <IconFileDescription className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate" title={file.name}>{file.name}</DialogTitle>
            <DialogDescription className="truncate pt-0 text-sm" title={`${file.space} / ${file.externalId}`}>{file.space} / {file.externalId}</DialogDescription>
          </div>
          <DialogClose aria-label="Close file viewer" render={<Button variant="ghost" size="icon" />}>
            <IconX aria-hidden />
          </DialogClose>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2" role="group" aria-label="File controls">
          <div className="flex items-center gap-2">
            {numPages > 0 && (
              <>
                <Button variant="outline" size="icon" aria-label="Previous page" title="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}><IconChevronLeft aria-hidden /></Button>
                <span className="min-w-24 text-center text-sm" role="status">Page {page} of {numPages}</span>
                <Button variant="outline" size="icon" aria-label="Next page" title="Next page" disabled={page >= numPages} onClick={() => setPage(page + 1)}><IconChevronRight aria-hidden /></Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2" role="group" aria-label="Zoom controls">
            <Button variant="outline" size="icon" aria-label="Zoom out" title="Zoom out" disabled={zoom <= FILE_VIEWER_MIN_ZOOM} onClick={() => setZoom(Math.max(FILE_VIEWER_MIN_ZOOM, zoom - FILE_VIEWER_ZOOM_STEP))}><IconMinus aria-hidden /></Button>
            <span className="min-w-12 text-center text-sm">{Math.round(zoom * PERCENT_FACTOR)}%</span>
            <Button variant="outline" size="icon" aria-label="Zoom in" title="Zoom in" disabled={zoom >= FILE_VIEWER_MAX_ZOOM} onClick={() => setZoom(Math.min(FILE_VIEWER_MAX_ZOOM, zoom + FILE_VIEWER_ZOOM_STEP))}><IconPlus aria-hidden /></Button>
            <Button variant="secondary" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><IconMaximize aria-hidden />Reset view</Button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted-background">
          <Suspense fallback={<FileLoading />}>
            <Viewer
              key={attempt}
              source={{ type: 'instanceId', space: file.space, externalId: file.externalId }}
              client={client}
              alt={file.name}
              page={page}
              onPageChange={setPage}
              onDocumentLoad={({ numPages: count }: { numPages: number }) => setNumPages(count)}
              zoom={zoom}
              onZoomChange={setZoom}
              panOffset={pan}
              onPanChange={setPan}
              minZoom={FILE_VIEWER_MIN_ZOOM}
              maxZoom={FILE_VIEWER_MAX_ZOOM}
              fitMode="width"
              className="h-full w-full"
              renderLoading={() => <FileLoading />}
              renderError={(error: Error) => (
                <div className="p-4">
                  <RetryAlert message={`Failed to load file: ${error.message}`} onRetry={handleRetry} />
                </div>
              )}
              renderUnsupported={(mimeType: string | undefined) => (
                <div className="p-4">
                  <RetryAlert message={`Preview is not available for this file type${mimeType ? ` (${mimeType})` : ''}.`} />
                </div>
              )}
            />
          </Suspense>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><IconLock size={ICON_SIZE_CAPTION_PX} aria-hidden />Read-only · CDF file</span>
          <span>Ctrl/Cmd + scroll to zoom · Middle-drag to pan</span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function FileLoading() {
  return <LoadingNotice label="Loading file" className="p-4" />;
}
