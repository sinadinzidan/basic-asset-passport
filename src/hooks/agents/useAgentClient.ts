import { createContext, useContext } from 'react';

import type { AgentContextType } from '../../types/agent';

export const AgentClientContext = createContext<AgentContextType | null>(null);

export function useAgentClient(): AgentContextType {
  const context = useContext(AgentClientContext);

  if (context === null) {
    throw new Error('useAgentClient must be used inside an AgentClientContext provider.');
  }

  return context;
}
