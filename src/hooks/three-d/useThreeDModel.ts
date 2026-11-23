import { useQuery } from '@tanstack/react-query';

import { THREE_D_MODEL_REFERENCE, THREE_D_QUERY_STALE_TIME_MS } from '../../constants/threeD';
import { toQueryState } from '../../lib/queryState';
import type { ThreeDModelReference as ThreeDModelReference } from '../../types/threeD';

import { useThreeDClient } from './useThreeDClient';

export function getThreeDModelQueryKey(
  project: string,
  { modelId, revisionId }: ThreeDModelReference,
) {
  return ['three-d-model', project, modelId, revisionId];
}

export function useThreeDModel(reference: ThreeDModelReference = THREE_D_MODEL_REFERENCE) {
  const client = useThreeDClient();

  const query = useQuery({
    queryKey: getThreeDModelQueryKey(client.project, reference),
    queryFn: () => client.loadModel(reference),
    staleTime: THREE_D_QUERY_STALE_TIME_MS,
  });

  return toQueryState(query);
}
