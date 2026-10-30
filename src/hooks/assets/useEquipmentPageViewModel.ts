import { useCogniteSdk } from '@cognite/app-sdk/react';
import { createContext, useContext, useMemo } from 'react';

import { buildEquipmentPassports } from '../../lib/equipmentPassport';
import type { AssetSelection, FileRecord } from '../../types/asset';
import type { AssetPassportRecord } from '../../types/passport';

import { useAssetEquipment, useRelatedFiles } from './useAssetList';

const defaultDeps = { useCogniteSdk, useAssetEquipment, useRelatedFiles };
export type EquipmentPageViewModelContextType = typeof defaultDeps;
export const EquipmentPageViewModelContext = createContext<EquipmentPageViewModelContextType>(defaultDeps);

export interface EquipmentPageViewModel {
  client: ReturnType<typeof useCogniteSdk>;
  passports?: AssetPassportRecord[];
  assetFiles: FileRecord[];
  isEquipmentFetching: boolean;
  equipmentErrorMessage?: string;
  isFilesLoading: boolean;
  isFilesFetching: boolean;
  filesErrorMessage?: string;
  retryEquipment: () => void;
  retryFiles: () => void;
}

export function useEquipmentPageViewModel(selectedAsset: AssetSelection): EquipmentPageViewModel {
  const { useCogniteSdk, useAssetEquipment, useRelatedFiles } = useContext(EquipmentPageViewModelContext);
  const client = useCogniteSdk();
  const equipmentQuery = useAssetEquipment(selectedAsset);
  const filesQuery = useRelatedFiles(selectedAsset, equipmentQuery.data);

  const passports = useMemo(
    () => (equipmentQuery.data ? buildEquipmentPassports(equipmentQuery.data, selectedAsset.name, filesQuery.data) : undefined),
    [equipmentQuery.data, selectedAsset.name, filesQuery.data]
  );

  return {
    client,
    passports,
    assetFiles: filesQuery.data?.assetFiles ?? [],
    isEquipmentFetching: equipmentQuery.isFetching,
    equipmentErrorMessage: equipmentQuery.error?.message,
    isFilesLoading: filesQuery.isLoading,
    isFilesFetching: filesQuery.isFetching,
    filesErrorMessage: filesQuery.error?.message,
    retryEquipment: () => void equipmentQuery.refetch(),
    retryFiles: () => void filesQuery.refetch(),
  };
}
