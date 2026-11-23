import { useQuery } from '@tanstack/react-query';

import { THREE_D_MODEL_REFERENCE, THREE_D_QUERY_STALE_TIME_MS } from '../../constants/threeD';
import type { ThreeDModelReference } from '../../types/threeD';

import { useThreeDClient } from './useThreeDClient';

export function useThreeDAssetNodes(reference: ThreeDModelReference = THREE_D_MODEL_REFERENCE) {
  const client = useThreeDClient();

  return useQuery({
    queryKey: ['three-d-asset-nodes', client.project, reference.modelId, reference.revisionId],
    queryFn: () => client.loadAssetNodes(reference),
    staleTime: THREE_D_QUERY_STALE_TIME_MS,
    retry: false,
  });
}
