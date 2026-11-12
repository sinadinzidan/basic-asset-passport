import type { AgentConversation, ChatMessage } from './agent';

export type AgentChatState = {
  conversations: Record<string, AgentConversation>;
};

type AgentChatActions = {
  addUserMessage: (agentExternalId: string, message: ChatMessage) => void;
  receiveReply: (agentExternalId: string, message: ChatMessage, cursor: string | null) => void;
  failSend: (agentExternalId: string, errorMessage: string) => void;
  retrySend: (agentExternalId: string) => void;
  resetConversation: (agentExternalId: string) => void;
};

export type AgentChatStore = AgentChatState & AgentChatActions;
