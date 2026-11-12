import { createContext, useContext } from 'react';

import type { AgentContextType } from '../../types/agent';

export const AgentContext = createContext<AgentContextType | null>(null);

export function useAgentContext(): AgentContextType {
  const context = useContext(AgentContext);

  if (context === null) {
    throw new Error('useAgentContext must be used inside an AgentContext provider.');
  }

  return context;
}
