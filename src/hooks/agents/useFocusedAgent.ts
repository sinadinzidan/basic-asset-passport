import { createContext, useContext } from 'react';

import { FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';

import { useAgent } from './useAgent';

const defaultDeps = { focusedAgentExternalId: FOCUSED_AGENT_EXTERNAL_ID };

type UseFocusedAgentContextType = typeof defaultDeps;
export const UseFocusedAgentContext = createContext<UseFocusedAgentContextType>(defaultDeps);

export function useFocusedAgent(shouldLookUp: boolean) {
  const { focusedAgentExternalId } = useContext(UseFocusedAgentContext);

  return useAgent(focusedAgentExternalId, shouldLookUp);
}
