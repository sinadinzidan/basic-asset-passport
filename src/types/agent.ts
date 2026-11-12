import type { ChatMessageRole } from '../enums/chatMessageRole';

export type CdfAgent = {
  externalId: string;
  name: string;
  description: string | null;
};

export type AgentChatRequest = {
  agentExternalId: string;
  text: string;
  cursor: string | null;
};

export type AgentReply = {
  text: string;
  cursor: string | null;
};

export type AgentContextType = {
  project: string;
  getAgent: (externalId: string) => Promise<CdfAgent | null>;
  chat: (request: AgentChatRequest) => Promise<AgentReply>;
};

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
};

export type AgentConversation = {
  messages: ChatMessage[];
  cursor: string | null;
  isSending: boolean;
  errorMessage: string | null;
};
