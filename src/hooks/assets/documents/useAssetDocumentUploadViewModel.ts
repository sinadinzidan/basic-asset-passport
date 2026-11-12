import type { AssetIdentifier } from '../../../types/asset';

import { useUploadAssetDocuments } from './useUploadAssetDocuments';

export function useAssetDocumentUploadViewModel(assetIdentifier: AssetIdentifier) {
  const { mutate, isPending, data, variables } = useUploadAssetDocuments(assetIdentifier);

  const failures = (data ?? []).filter((result) => result.errorMessage);
  const failedFiles = (variables ?? []).filter((_file, index) => data?.[index]?.errorMessage);

  function upload(files: File[]): void {
    if (files.length > 0) mutate(files);
  }

  function retryFailed(): void {
    mutate(failedFiles);
  }

  return { isUploading: isPending, failures, upload, retryFailed };
}
