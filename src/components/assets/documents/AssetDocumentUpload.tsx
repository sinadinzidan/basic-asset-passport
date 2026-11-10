import { IconUpload } from '@tabler/icons-react';
import { useRef, type ChangeEvent } from 'react';

import { DOCUMENT_MAX_FILE_SIZE_LABEL } from '../../../constants/documents';
import { useUploadAssetDocuments } from '../../../hooks/assets/documents/useUploadAssetDocuments';
import type { AssetIdentifier } from '../../../types/asset';
import { AppAlert } from '../../general/AppAlert';
import { GeneralButton } from '../../general/GeneralButton';

type AssetDocumentUploadProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDocumentUpload({
  assetIdentifier,
}: AssetDocumentUploadProps) {
  const { mutate, isPending, data } = useUploadAssetDocuments(assetIdentifier);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const failures = (data ?? []).filter((result) => result.errorMessage);

  function handleChooseClick(): void {
    fileInputRef.current?.click();
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);
    // Clearing the input lets the same file be chosen again after a failure.
    event.target.value = '';
    if (files.length === 0) return;

    mutate(files);
  }

  return (
    <section
      aria-label="Upload documents"
      className="data-card flex flex-col gap-4 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Choose one or more files, up to {DOCUMENT_MAX_FILE_SIZE_LABEL} each.
        </p>
        <GeneralButton
          disabled={isPending}
          onClick={handleChooseClick}
        >
          <IconUpload aria-hidden className="size-4" />
          {isPending ? 'Uploading...' : 'Upload documents'}
        </GeneralButton>
        <input
          ref={fileInputRef}
          aria-label="Choose documents to upload"
          className="sr-only"
          multiple
          onChange={handleFilesChange}
          tabIndex={-1}
          type="file"
        />
      </div>
      {failures.length > 0 ? (
        <AppAlert variant="error" title="Some documents could not be uploaded">
          <ul className="list-disc pl-5">
            {failures.map((failure) => (
              <li key={failure.fileName}>
                {failure.fileName}: {failure.errorMessage}
              </li>
            ))}
          </ul>
        </AppAlert>
      ) : null}
    </section>
  );
}
