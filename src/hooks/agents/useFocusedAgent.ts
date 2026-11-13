import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { AGENT_QUERY_STALE_TIME_MS, FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';
import { toQueryState } from '../../lib/queryState';

import { useAgentContext } from './useAgentContext';

const defaultDeps = { focusedAgentExternalId: FOCUSED_AGENT_EXTERNAL_ID };

type UseFocusedAgentContextType = typeof defaultDeps;
export const UseFocusedAgentContext = createContext<UseFocusedAgentContextType>(defaultDeps);

export function getAgentQueryKey(project: string, externalId: string) {
  return ['agent', project, externalId];
}

export function useFocusedAgent(shouldLookUp: boolean) {
  const { focusedAgentExternalId } = useContext(UseFocusedAgentContext);
  const { project, getAgent } = useAgentContext();

  const query = useQuery({
    queryKey: getAgentQueryKey(project, focusedAgentExternalId),
    queryFn: () => getAgent(focusedAgentExternalId),
    staleTime: AGENT_QUERY_STALE_TIME_MS,
    enabled: shouldLookUp,
  });

  return toQueryState(query);
}
