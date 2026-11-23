import { useQuery } from '@tanstack/react-query';

import { THREE_D_MODEL_NAME, THREE_D_QUERY_STALE_TIME_MS } from '../../constants/threeD';
import { toQueryState } from '../../lib/queryState';

import { useThreeDClient } from './useThreeDClient';

export function getThreeDModelQueryKey(project: string, name: string) {
  return ['three-d-model', project, name];
}

export function useThreeDModel(name: string = THREE_D_MODEL_NAME) {
  const client = useThreeDClient();

  const query = useQuery({
    queryKey: getThreeDModelQueryKey(client.project, name),
    queryFn: () => client.findModel(name),
    staleTime: THREE_D_QUERY_STALE_TIME_MS,
  });

  return toQueryState(query);
}
