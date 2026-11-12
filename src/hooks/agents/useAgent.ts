import { useQuery } from '@tanstack/react-query';

import { AGENT_QUERY_STALE_TIME_MS } from '../../constants/agents';

import { useAgentContext } from './useAgentContext';

export function getAgentQueryKey(project: string, externalId: string) {
  return ['agent', project, externalId];
}

export function useAgent(externalId: string) {
  const { project, getAgent } = useAgentContext();

  return useQuery({
    queryKey: getAgentQueryKey(project, externalId),
    queryFn: () => getAgent(externalId),
    staleTime: AGENT_QUERY_STALE_TIME_MS,
  });
}
