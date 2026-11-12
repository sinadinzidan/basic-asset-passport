import { createStore, type StoreApi } from 'zustand/vanilla';

import type { AgentConversation } from '../types/agent';
import type { AgentChatState, AgentChatStore } from '../types/agentChat';

export const EMPTY_CONVERSATION: AgentConversation = {
  messages: [],
  cursor: null,
  isSending: false,
  errorMessage: null,
};

export const INITIAL_AGENT_CHAT_STATE: AgentChatState = {
  conversations: {},
};

export function getConversation(state: AgentChatState, agentExternalId: string): AgentConversation {
  return state.conversations[agentExternalId] ?? EMPTY_CONVERSATION;
}

export function createAgentChatStore(
  initialState: AgentChatState = INITIAL_AGENT_CHAT_STATE,
): StoreApi<AgentChatStore> {
  return createStore<AgentChatStore>()((set) => {
    function updateConversation(
      agentExternalId: string,
      update: (conversation: AgentConversation) => AgentConversation,
    ): void {
      set((state) => ({
        conversations: {
          ...state.conversations,
          [agentExternalId]: update(getConversation(state, agentExternalId)),
        },
      }));
    }

    return {
      ...initialState,
      addUserMessage: (agentExternalId, message) =>
        updateConversation(agentExternalId, (current) => ({
          ...current,
          messages: [...current.messages, message],
          isSending: true,
          errorMessage: null,
        })),
      receiveReply: (agentExternalId, message, cursor) =>
        updateConversation(agentExternalId, (current) => ({
          ...current,
          messages: [...current.messages, message],
          cursor: cursor ?? current.cursor,
          isSending: false,
        })),
      failSend: (agentExternalId, errorMessage) =>
        updateConversation(agentExternalId, (current) => ({
          ...current,
          isSending: false,
          errorMessage,
        })),
      retrySend: (agentExternalId) =>
        updateConversation(agentExternalId, (current) => ({
          ...current,
          isSending: true,
          errorMessage: null,
        })),
      resetConversation: (agentExternalId) =>
        updateConversation(agentExternalId, () => EMPTY_CONVERSATION),
    };
  });
}

export const agentChatStore = createAgentChatStore();
