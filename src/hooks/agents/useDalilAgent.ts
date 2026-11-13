import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { AGENT_QUERY_STALE_TIME_MS, FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';
import { toQueryState } from '../../lib/queryState';

import { useAgentClient } from './useAgentClient';

const defaultDeps = { focusedAgentExternalId: FOCUSED_AGENT_EXTERNAL_ID };

type UseDalilAgentContextType = typeof defaultDeps;
export const UseDalilAgentContext = createContext<UseDalilAgentContextType>(defaultDeps);

export function getAgentQueryKey(project: string, externalId: string) {
  return ['agent', project, externalId];
}

export function useDalilAgent(shouldLookUp: boolean) {
  const { focusedAgentExternalId } = useContext(UseDalilAgentContext);
  const { project, getAgent } = useAgentClient();

  const query = useQuery({
    queryKey: getAgentQueryKey(project, focusedAgentExternalId),
    queryFn: () => getAgent(focusedAgentExternalId),
    staleTime: AGENT_QUERY_STALE_TIME_MS,
    enabled: shouldLookUp,
  });

  return toQueryState(query);
}
