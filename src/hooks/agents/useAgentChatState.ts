import { createContext, useContext, type Dispatch } from 'react';

import type { AgentChatAction, AgentChatState } from './agentChatReducer';

export type AgentChatStore = {
  state: AgentChatState;
  dispatch: Dispatch<AgentChatAction>;
};

export const AgentChatStateContext = createContext<AgentChatStore | null>(null);

/** The chosen agent and every conversation, shared by the whole helper. */
export function useAgentChatState(): AgentChatStore {
  const store = useContext(AgentChatStateContext);

  if (store === null) {
    throw new Error(
      'useAgentChatState must be used inside an AgentChatStateProvider.',
    );
  }

  return store;
}
