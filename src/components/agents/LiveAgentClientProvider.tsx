import { useCogniteSdk } from '@cognite/app-sdk/react';
import { useMemo, type ReactNode } from 'react';

import { AgentClientContext } from '../../hooks/agents/useAgentClient';
import { createAgentClient } from '../../services/agents/agentClient';

type LiveAgentClientProviderProps = {
  children: ReactNode;
};

/** Provides the agent client built on the authenticated Flows SDK client. */
export function LiveAgentClientProvider({
  children,
}: LiveAgentClientProviderProps) {
  const client = useCogniteSdk();
  const agentClient = useMemo(() => createAgentClient(client), [client]);

  return (
    <AgentClientContext.Provider value={agentClient}>
      {children}
    </AgentClientContext.Provider>
  );
}
