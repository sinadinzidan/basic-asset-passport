import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import { AgentClientContext } from '../../hooks/agents/useAgentClient';
import { limitCdfCalls } from '../../lib/limitedCdfClient';
import { createAgentContext } from '../../services/agents/agentContext';

type AgentProviderProps = {
  children: ReactNode;
};

export function AgentProvider({ children }: AgentProviderProps) {
  const client = useCogniteSdk();
  const agentContext = useMemo(() => createAgentContext(limitCdfCalls(client)), [client]);

  return <AgentClientContext.Provider value={agentContext}>{children}</AgentClientContext.Provider>;
}
