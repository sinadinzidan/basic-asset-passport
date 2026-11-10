import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { createAssetNote } from '../../../services/assets/notes/assetNoteService';
import type { AssetIdentifier } from '../../../types/asset';
import type { NewAssetNote } from '../../../types/note';
import { useAssetDataClient } from '../useAssetDataClient';

import { getAssetNotesQueryKey } from './useAssetNotes';

const defaultDeps = { useAssetDataClient, createAssetNote };

export type UseAddAssetNoteContextType = typeof defaultDeps;
export const UseAddAssetNoteContext =
  createContext<UseAddAssetNoteContextType>(defaultDeps);

export function useAddAssetNote(assetIdentifier: AssetIdentifier) {
  const { useAssetDataClient: useClient, createAssetNote: createNote } =
    useContext(UseAddAssetNoteContext);
  const client = useClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: NewAssetNote) =>
      createNote(client, assetIdentifier, note),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getAssetNotesQueryKey(client.project, assetIdentifier),
      }),
  });
}
