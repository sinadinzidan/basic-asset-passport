import { IconEyeOff } from '@tabler/icons-react';

import { DOCUMENT_PREVIEW_UNAVAILABLE_MESSAGE } from '../../../constants/documents';
import { DialogSize } from '../../../enums/dialogSize';
import { useDocumentPreview } from '../../../hooks/assets/documents/useDocumentPreview';
import type { AssetDocument } from '../../../types/document';
import { GeneralDialog } from '../../general';

type DocumentPreviewDialogProps = {
  document: AssetDocument;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function DocumentPreviewDialog({
  document,
  isOpen,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const renderPreview = useDocumentPreview();

  return (
    <GeneralDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size={DialogSize.LARGE}
      title={document.name}
    >
      {renderPreview ? (
        renderPreview(document)
      ) : (
        <div
          className="flex flex-col items-center gap-4 px-6 py-10 text-center"
          data-slot="document-preview-unavailable"
        >
          <span aria-hidden className="icon-chip size-12">
            <IconEyeOff aria-hidden className="size-5" />
          </span>
          <p className="text-base-foreground">{DOCUMENT_PREVIEW_UNAVAILABLE_MESSAGE}</p>
        </div>
      )}
    </GeneralDialog>
  );
}
