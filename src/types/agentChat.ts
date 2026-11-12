import type { AgentConversation, CdfAgent, ChatMessage } from './agent';

export type AgentChatState = {
  selectedAgent: CdfAgent | null;

  conversations: Record<string, AgentConversation>;
};

export type AgentChatActions = {
  selectAgent: (agent: CdfAgent | null) => void;

  addUserMessage: (agentExternalId: string, message: ChatMessage) => void;

  receiveReply: (agentExternalId: string, message: ChatMessage, cursor: string | null) => void;
  failSend: (agentExternalId: string, errorMessage: string) => void;
  retrySend: (agentExternalId: string) => void;
  resetConversation: (agentExternalId: string) => void;
};

export type AgentChatStore = AgentChatState & AgentChatActions;
