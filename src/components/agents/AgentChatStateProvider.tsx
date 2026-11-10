import { useMemo, useReducer, type ReactNode } from 'react';

import {
  agentChatReducer,
  INITIAL_AGENT_CHAT_STATE,
  type AgentChatState,
} from '../../hooks/agents/agentChatReducer';
import { AgentChatStateContext } from '../../hooks/agents/useAgentChatState';

type AgentChatStateProviderProps = {
  children: ReactNode;
  initialState?: AgentChatState;
};

/**
 * Keeps the chosen agent and the conversations for as long as the app is open.
 * They are not synced to the host: a chat is not expected to survive a reload.
 */
export function AgentChatStateProvider({
  children,
  initialState = INITIAL_AGENT_CHAT_STATE,
}: AgentChatStateProviderProps) {
  const [state, dispatch] = useReducer(agentChatReducer, initialState);
  const store = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <AgentChatStateContext.Provider value={store}>
      {children}
    </AgentChatStateContext.Provider>
  );
}
