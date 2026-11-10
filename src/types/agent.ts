/** An AI agent configured in the CDF project. */
export type CdfAgent = {
  externalId: string;
  name: string;
  description: string | null;
};

export type AgentChatRequest = {
  agentExternalId: string;
  text: string;
  /** The cursor of the last reply, to continue a conversation; null to start one. */
  cursor: string | null;
};

export type AgentReply = {
  text: string;
  cursor: string | null;
};

export type AgentClient = {
  project: string;
  /** The agent with this external ID, or null when the project has none. */
  getAgent: (externalId: string) => Promise<CdfAgent | null>;
  chat: (request: AgentChatRequest) => Promise<AgentReply>;
};

export type ChatMessageRole = 'USER' | 'AGENT';

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
