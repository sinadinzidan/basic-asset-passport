import { Badge } from '@cognite/aura/components/badge';
import {
  IconClockHour4,
  IconEye,
  IconFile,
  IconFileCode,
  IconFileSpreadsheet,
  IconFileText,
  IconFileTypePdf,
  IconPhoto,
  IconPresentation,
  IconTrash,
  type Icon,
} from '@tabler/icons-react';
import { useState } from 'react';

import {
  DOCUMENT_DELETE_DIALOG_TITLE,
  DOCUMENT_DELETE_WARNING,
  DOCUMENT_PROCESSING_LABEL,
  DOCUMENT_UPLOAD_INCOMPLETE_LABEL,
  DOCUMENT_UPLOADED_PREFIX,
  EXISTING_FILE_LABEL,
} from '../../../constants/documents';
import { DocumentKind } from '../../../enums/documentKind';
import { DocumentOrigin } from '../../../enums/documentOrigin';
import { DocumentUploadStatus } from '../../../enums/documentUploadStatus';
import { IconActionVariant } from '../../../enums/iconActionVariant';
import { StatusTone } from '../../../enums/statusTone';
import { formatDocumentType, getDocumentKind } from '../../../lib/documentType';
import { formatNoteDate } from '../../../lib/formatNoteDate';
import type { AssetDocument } from '../../../types/document';
import { ConfirmDeleteDialog } from '../../general/ConfirmDeleteDialog';
import { IconActionButton } from '../../general/IconActionButton';
import { StatusPill } from '../../general/StatusPill';

import { DocumentPreviewDialog } from './DocumentPreviewDialog';

const DOCUMENT_KIND_ICONS: Record<DocumentKind, Icon> = {
  [DocumentKind.PDF]: IconFileTypePdf,
  [DocumentKind.IMAGE]: IconPhoto,
  [DocumentKind.SPREADSHEET]: IconFileSpreadsheet,
  [DocumentKind.DOCUMENT]: IconFileText,
  [DocumentKind.PRESENTATION]: IconPresentation,
  [DocumentKind.DATA]: IconFileCode,
  [DocumentKind.FILE]: IconFile,
};

type AssetDocumentItemProps = {
  document: AssetDocument;
  isDeleting: boolean;
  onDelete: (document: AssetDocument) => Promise<void>;
};

export function AssetDocumentItem({ document, isDeleting, onDelete }: AssetDocumentItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const canDelete = document.origin === DocumentOrigin.APP;
  const typeLabel = formatDocumentType(document.mimeType);
  const KindIcon = DOCUMENT_KIND_ICONS[getDocumentKind(document.mimeType)];
  const uploadedLabel =
    document.uploadStatus === DocumentUploadStatus.UPLOADED && document.uploadedTime !== null
      ? `${DOCUMENT_UPLOADED_PREFIX} ${formatNoteDate(document.uploadedTime)}`
      : null;

  function handleViewClick(): void {
    setIsPreviewing(true);
  }
  function handlePreviewOpenChange(isOpen: boolean): void {
    setIsPreviewing(isOpen);
  }
  function handleDeleteClick(): void {
    setIsConfirmingDelete(true);
  }
  function handleDeleteConfirm(): Promise<void> {
    return onDelete(document);
  }
  function handleDeleteClose(): void {
    setIsConfirmingDelete(false);
  }

  return (
    <article className="data-card">
      <header className="data-card__header">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="icon-chip size-12">
            <KindIcon className="size-6" />
          </span>
          <div className="min-w-0 space-y-2">
            <h3 className="font-display min-w-0 break-words text-lg font-semibold leading-tight tracking-wide">
              {document.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <Badge data-tone="neutral" variant="secondary">
                {typeLabel}
              </Badge>
              {canDelete ? null : <StatusPill status={EXISTING_FILE_LABEL} />}
              {document.uploadStatus === DocumentUploadStatus.PROCESSING ? (
                <StatusPill status={DOCUMENT_PROCESSING_LABEL} />
              ) : uploadedLabel === null ? (
                <StatusPill status={DOCUMENT_UPLOAD_INCOMPLETE_LABEL} tone={StatusTone.WARNING} />
              ) : (
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                  <IconClockHour4 aria-hidden className="size-4" />
                  {uploadedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <IconActionButton
            icon={<IconEye aria-hidden className="size-4" />}
            isDisabled={!document.isUploaded}
            label={`View ${document.name}`}
            onClick={handleViewClick}
          />
          {canDelete ? (
            <IconActionButton
              icon={<IconTrash aria-hidden className="size-4" />}
              isDisabled={isDeleting}
              label={`Delete ${document.name}`}
              onClick={handleDeleteClick}
              variant={IconActionVariant.DESTRUCTIVE}
            />
          ) : null}
        </div>
      </header>
      <DocumentPreviewDialog
        document={document}
        isOpen={isPreviewing}
        onOpenChange={handlePreviewOpenChange}
      />
      <ConfirmDeleteDialog
        isOpen={isConfirmingDelete}
        title={DOCUMENT_DELETE_DIALOG_TITLE}
        confirmLabel="Delete document"
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
      >
        {document.name} {DOCUMENT_DELETE_WARNING}
      </ConfirmDeleteDialog>
    </article>
  );
}
