import { createContext, useContext } from 'react';
import { useStore, type StoreApi } from 'zustand';

import { agentChatStore } from '../../store/agents';
import type { AgentChatStore } from '../../types/agentChat';

export const AgentChatStoreContext = createContext<StoreApi<AgentChatStore>>(agentChatStore);

export function useAgentConversation<Slice>(select: (store: AgentChatStore) => Slice): Slice {
  return useStore(useContext(AgentChatStoreContext), select);
}
