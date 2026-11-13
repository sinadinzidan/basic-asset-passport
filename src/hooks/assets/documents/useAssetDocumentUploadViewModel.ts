import { useSelectedAsset } from '../useSelectedAsset';

import { useUploadAssetDocuments } from './useUploadAssetDocuments';

export function useAssetDocumentUploadViewModel() {
  const assetIdentifier = useSelectedAsset();
  const uploads = useUploadAssetDocuments(assetIdentifier);

  const failures = uploads.results.filter((result) => result.errorMessage);
  const failedFiles = uploads.uploadedFiles.filter(
    (_file, index) => uploads.results[index]?.errorMessage,
  );

  function upload(files: File[]): void {
    if (files.length > 0) void uploads.upload(files);
  }

  function retryFailed(): void {
    void uploads.upload(failedFiles);
  }

  return { isUploading: uploads.isUploading, failures, upload, retryFailed };
}
