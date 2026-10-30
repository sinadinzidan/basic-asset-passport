import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { ASSET_PAGE_SIZE, ASSET_SEARCH_LIMIT, ASSET_VIEW, EQUIPMENT_PAGE_SIZE, EQUIPMENT_VIEW, FILE_VIEW, RELATED_FILES_LIMIT } from '../../constants/assets';
import { fetchAssetEquipment, fetchAssets, fetchRelatedFiles, searchAssets } from '../../services/assets/assetService';
import type { EquipmentRecord, InstanceReference } from '../../types/asset';

const defaultDeps = { useCogniteSdk, fetchAssets, searchAssets, fetchAssetEquipment, fetchRelatedFiles };
export type AssetListContextType = typeof defaultDeps;
export const AssetListContext = createContext<AssetListContextType>(defaultDeps);

function buildAssetPageKey(project: string, pageSize: number, pageIndex: number, search: string) {
  return ['assets', project, ASSET_VIEW, pageSize, pageIndex, search];
}

function collectFileRefs(equipment: EquipmentRecord[] | undefined): InstanceReference[] {
  return equipment?.flatMap((item) => item.fileRefs ?? []) ?? [];
}

export function useAssetList(page: number = 0, search: string = '', pageSize: number = ASSET_PAGE_SIZE) {
  const { useCogniteSdk, fetchAssets, searchAssets } = useContext(AssetListContext);
  const client = useCogniteSdk();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: buildAssetPageKey(client.project, pageSize, page, search),
    queryFn: async () => {
      if (search) {
        // The search API has no cursor, so ask for just enough matches to fill this page (plus one to know if more exist).
        const limit = Math.min(ASSET_SEARCH_LIMIT, (page + 1) * pageSize + 1);
        const results = await queryClient.ensureQueryData({
          queryKey: ['asset-search', client.project, ASSET_VIEW, search, limit],
          queryFn: () => searchAssets(client, search, limit),
          staleTime: Infinity,
        });
        if (page > 0 && page * pageSize >= results.length) {
          throw new Error('This asset page is no longer available. Return to the first page.');
        }
        return {
          items: results.slice(page * pageSize, (page + 1) * pageSize),
          hasMore: (page + 1) * pageSize < results.length,
          isSearchLimited: limit === ASSET_SEARCH_LIMIT && results.length === ASSET_SEARCH_LIMIT,
        };
      }
      let cursors: Record<string, string> | undefined;
      for (let pageIndex = 0; pageIndex < page; pageIndex++) {
        const pageCursors = cursors;
        const previousPage = await queryClient.ensureQueryData({
          queryKey: buildAssetPageKey(client.project, pageSize, pageIndex, search),
          queryFn: () => fetchAssets(client, pageSize, pageCursors),
        });
        cursors = previousPage.nextCursor;
        if (!cursors || Object.keys(cursors).length === 0) {
          throw new Error('This asset page is no longer available. Return to the first page.');
        }
      }

      return fetchAssets(client, pageSize, cursors);
    },
    staleTime: Infinity,
    placeholderData: (previousPage) => previousPage,
  });

  return { ...query, project: client.project };
}

export function useAssetEquipment(asset: { space: string; externalId: string }) {
  const { useCogniteSdk, fetchAssetEquipment } = useContext(AssetListContext);
  const client = useCogniteSdk();

  return useQuery({
    queryKey: ['asset-equipment', client.project, EQUIPMENT_VIEW, asset.space, asset.externalId, EQUIPMENT_PAGE_SIZE],
    queryFn: () => fetchAssetEquipment(client, asset, EQUIPMENT_PAGE_SIZE),
  });
}

export function useRelatedFiles(asset: InstanceReference, equipment: EquipmentRecord[] | undefined) {
  const { useCogniteSdk, fetchRelatedFiles } = useContext(AssetListContext);
  const client = useCogniteSdk();

  return useQuery({
    queryKey: ['related-files', client.project, FILE_VIEW, asset.space, asset.externalId, collectFileRefs(equipment), RELATED_FILES_LIMIT],
    queryFn: () => fetchRelatedFiles(client, asset, collectFileRefs(equipment), RELATED_FILES_LIMIT),
    enabled: equipment !== undefined,
  });
}
