import { createContext, useContext } from 'react';

import type { AgentClient } from '../../types/agent';

export const AgentClientContext = createContext<AgentClient | null>(null);

export function useAgentClient(): AgentClient {
  const client = useContext(AgentClientContext);

  if (client === null) {
    throw new Error(
      'useAgentClient must be used inside an AgentClientContext provider.',
    );
  }

  return client;
}
