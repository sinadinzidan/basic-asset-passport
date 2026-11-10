import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { AGENT_QUERY_STALE_TIME_MS } from '../../constants/agents';

import { useAgentClient } from './useAgentClient';

const defaultDeps = { useAgentClient };

export type UseAgentContextType = typeof defaultDeps;
export const UseAgentContext = createContext<UseAgentContextType>(defaultDeps);

export function getAgentQueryKey(project: string, externalId: string) {
  return ['agent', project, externalId];
}

/** Looks up one agent by external ID; the data is null when the project has none. */
export function useAgent(externalId: string) {
  const { useAgentClient: useClient } = useContext(UseAgentContext);
  const client = useClient();

  return useQuery({
    queryKey: getAgentQueryKey(client.project, externalId),
    queryFn: () => client.getAgent(externalId),
    staleTime: AGENT_QUERY_STALE_TIME_MS,
  });
}
