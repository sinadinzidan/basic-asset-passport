import type { AgentConversation, ChatMessage } from './agent';

export type AgentChatState = {
  conversations: Record<string, AgentConversation>;
  draft: string;
  isMascotPointedAt: boolean;
  isPanelClosing: boolean;
};

type AgentChatActions = {
  addUserMessage: (agentExternalId: string, message: ChatMessage) => void;
  receiveReply: (agentExternalId: string, message: ChatMessage, cursor: string | null) => void;
  failSend: (agentExternalId: string, errorMessage: string) => void;
  retrySend: (agentExternalId: string) => void;
  resetConversation: (agentExternalId: string) => void;
  changeDraft: (draft: string) => void;
  changeMascotPointedAt: (isPointedAt: boolean) => void;
  changePanelClosing: (isClosing: boolean) => void;
};

export type AgentChatStore = AgentChatState & AgentChatActions;
