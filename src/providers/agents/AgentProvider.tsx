import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import { AgentContext } from '../../hooks/agents/useAgentContext';
import { limitCdfCalls } from '../../lib/limitedCdfClient';
import { createAgentContext } from '../../services/agents/agentContext';

type AgentProviderProps = {
  children: ReactNode;
};

export function AgentProvider({ children }: AgentProviderProps) {
  const client = useCogniteSdk();
  const agentContext = useMemo(() => createAgentContext(limitCdfCalls(client)), [client]);

  return <AgentContext.Provider value={agentContext}>{children}</AgentContext.Provider>;
}
