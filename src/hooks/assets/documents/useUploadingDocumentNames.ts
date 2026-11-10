import { useMutationState } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import type { AssetIdentifier } from '../../../types/asset';
import { useAssetDataClient } from '../useAssetDataClient';

import { getUploadAssetDocumentsMutationKey } from './useUploadAssetDocuments';

const defaultDeps = { useAssetDataClient };

export type UseUploadingDocumentNamesContextType = typeof defaultDeps;
export const UseUploadingDocumentNamesContext =
  createContext<UseUploadingDocumentNamesContextType>(defaultDeps);

/**
 * The names of the files being uploaded to the asset right now. The uploads
 * live in the query cache, so the list sees them whichever component started
 * them, and they stay visible if the user leaves the tab and comes back.
 */
export function useUploadingDocumentNames(
  assetIdentifier: AssetIdentifier,
): string[] {
  const { useAssetDataClient: useClient } = useContext(
    UseUploadingDocumentNamesContext,
  );
  const client = useClient();

  const uploads = useMutationState({
    filters: {
      mutationKey: getUploadAssetDocumentsMutationKey(
        client.project,
        assetIdentifier,
      ),
      status: 'pending',
    },
    select: (mutation) => mutation.state.variables,
  });

  return uploads.flatMap(getFileNames);
}

function getFileNames(variables: unknown): string[] {
  if (!Array.isArray(variables)) return [];

  return variables.flatMap((value: unknown) =>
    value instanceof File ? [value.name] : [],
  );
}
