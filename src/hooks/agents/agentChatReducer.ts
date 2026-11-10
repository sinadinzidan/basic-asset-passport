import type {
  AgentConversation,
  CdfAgent,
  ChatMessage,
} from '../../types/agent';

export type AgentChatState = {
  selectedAgent: CdfAgent | null;
  conversations: Record<string, AgentConversation>;
};

export type AgentChatAction =
  | { type: 'AGENT_SELECTED'; agent: CdfAgent | null }
  | { type: 'MESSAGE_SENT'; agentExternalId: string; message: ChatMessage }
  | {
      type: 'REPLY_RECEIVED';
      agentExternalId: string;
      message: ChatMessage;
      cursor: string | null;
    }
  | { type: 'SEND_FAILED'; agentExternalId: string; errorMessage: string }
  | { type: 'CONVERSATION_RESET'; agentExternalId: string };

export const EMPTY_CONVERSATION: AgentConversation = {
  messages: [],
  cursor: null,
  isSending: false,
  errorMessage: null,
};

export const INITIAL_AGENT_CHAT_STATE: AgentChatState = {
  selectedAgent: null,
  conversations: {},
};

export function getConversation(
  state: AgentChatState,
  agentExternalId: string,
): AgentConversation {
  return state.conversations[agentExternalId] ?? EMPTY_CONVERSATION;
}

export function agentChatReducer(
  state: AgentChatState,
  action: AgentChatAction,
): AgentChatState {
  switch (action.type) {
    case 'AGENT_SELECTED':
      return { ...state, selectedAgent: action.agent };
    case 'MESSAGE_SENT':
      return updateConversation(state, action.agentExternalId, (current) => ({
        ...current,
        messages: [...current.messages, action.message],
        isSending: true,
        errorMessage: null,
      }));
    case 'REPLY_RECEIVED':
      return updateConversation(state, action.agentExternalId, (current) => ({
        ...current,
        messages: [...current.messages, action.message],
        cursor: action.cursor ?? current.cursor,
        isSending: false,
      }));
    case 'SEND_FAILED':
      return updateConversation(state, action.agentExternalId, (current) => ({
        ...current,
        isSending: false,
        errorMessage: action.errorMessage,
      }));
    case 'CONVERSATION_RESET':
      return updateConversation(
        state,
        action.agentExternalId,
        () => EMPTY_CONVERSATION,
      );
  }
}

function updateConversation(
  state: AgentChatState,
  agentExternalId: string,
  update: (conversation: AgentConversation) => AgentConversation,
): AgentChatState {
  return {
    ...state,
    conversations: {
      ...state.conversations,
      [agentExternalId]: update(getConversation(state, agentExternalId)),
    },
  };
}
