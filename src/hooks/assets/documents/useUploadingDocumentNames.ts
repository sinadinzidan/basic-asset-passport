import { useMutationState } from '@tanstack/react-query';

import type { AssetIdentifier } from '../../../types/asset';
import { useAssetContext } from '../useAssetContext';

import { getUploadAssetDocumentsMutationKey } from './useUploadAssetDocuments';

export function useUploadingDocumentNames(assetIdentifier: AssetIdentifier): string[] {
  const client = useAssetContext();
  const uploads = useMutationState({
    filters: {
      mutationKey: getUploadAssetDocumentsMutationKey(client.project, assetIdentifier),
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables,
  });

  return uploads.flatMap(getFileNames);
}

function getFileNames(variables: unknown): string[] {
  if (!Array.isArray(variables)) return [];

  return variables.flatMap((value: unknown) => (value instanceof File ? [value.name] : []));
}
