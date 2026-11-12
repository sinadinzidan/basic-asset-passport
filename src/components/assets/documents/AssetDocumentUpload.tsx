import { IconUpload } from '@tabler/icons-react';
import { useRef, type ChangeEvent } from 'react';

import {
  DOCUMENT_UPLOAD_ERROR_TITLE,
  DOCUMENT_UPLOAD_HINT,
  DOCUMENT_UPLOAD_RETRY_LABEL,
} from '../../../constants/documents';
import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { useUploadAssetDocuments } from '../../../hooks/assets/documents/useUploadAssetDocuments';
import type { AssetIdentifier } from '../../../types/asset';
import { AppAlert } from '../../general/AppAlert';
import { GeneralButton } from '../../general/GeneralButton';

type AssetDocumentUploadProps = {
  assetIdentifier: AssetIdentifier;
};

export function AssetDocumentUpload({ assetIdentifier }: AssetDocumentUploadProps) {
  const { mutate, isPending, data, variables } = useUploadAssetDocuments(assetIdentifier);

  const fileInputReference = useRef<HTMLInputElement>(null);

  const failures = (data ?? []).filter((result) => result.errorMessage);
  const failedFiles = (variables ?? []).filter((_file, index) => data?.[index]?.errorMessage);

  function handleChooseClick(): void {
    fileInputReference.current?.click();
  }

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? []);

    event.target.value = '';
    if (files.length === 0) return;

    mutate(files);
  }

  function handleRetryClick(): void {
    mutate(failedFiles);
  }

  return (
    <section aria-label="Upload documents" className="data-card flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{DOCUMENT_UPLOAD_HINT}</p>
        <GeneralButton disabled={isPending} onClick={handleChooseClick}>
          <IconUpload aria-hidden className="size-4" />
          {isPending ? 'Uploading...' : 'Upload documents'}
        </GeneralButton>
        <input
          ref={fileInputReference}
          aria-label="Choose documents to upload"
          className="sr-only"
          multiple
          onChange={handleFilesChange}
          tabIndex={-1}
          type="file"
        />
      </div>
      {failures.length > 0 ? (
        <AppAlert
          variant={AppAlertVariant.ERROR}
          title={DOCUMENT_UPLOAD_ERROR_TITLE}
          action={
            <GeneralButton onClick={handleRetryClick} variant="secondary">
              {DOCUMENT_UPLOAD_RETRY_LABEL}
            </GeneralButton>
          }
        >
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
