import { useDocumentPreview } from '../../../hooks/assets/documents/useDocumentPreview';
import type { AssetDocument } from '../../../types/document';
import { GeneralDialog } from '../../general/GeneralDialog';

type DocumentPreviewDialogProps = {
  document: AssetDocument;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** Shows the content of a document in a dialog, so the user never leaves the asset. */
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
      size="large"
      title={document.name}
    >
      {renderPreview ? (
        renderPreview(document)
      ) : (
        <p>Preview is not available here.</p>
      )}
    </GeneralDialog>
  );
}
