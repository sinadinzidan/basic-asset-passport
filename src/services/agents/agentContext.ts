import type { CogniteClient } from '@cognite/sdk';

import {
  APPROVAL_NOT_SUPPORTED_MESSAGE,
  NO_REPLY_MESSAGE,
  UNEXPECTED_AGENT_MESSAGE,
  UNEXPECTED_REPLY_MESSAGE,
} from '../../constants/agents';
import {
  BETA_API_HEADERS,
  TEXT_MESSAGE_CONTENT_TYPE,
  USER_MESSAGE_ROLE,
} from '../../constants/cdfApi';
import {
  AgentListResponseSchema,
  AgentMessageSchema,
  AgentReplyResponseSchema,
  AgentSchema,
} from '../../schemas/agent';
import type { AgentChatRequest, AgentContextType, AgentReply, CdfAgent } from '../../types/agent';

type AgentSdkClient = Pick<CogniteClient, 'project' | 'post'>;

class CdfAgentContext implements AgentContextType {
  readonly project: string;

  private readonly agentsPath: string;

  constructor(private readonly sdk: AgentSdkClient) {
    this.project = sdk.project;
    this.agentsPath = `/api/v1/projects/${encodeURIComponent(sdk.project)}/ai/agents`;
  }

  getAgent = async (externalId: string): Promise<CdfAgent | null> => {
    const response = await this.sdk.post<unknown>(`${this.agentsPath}/byids`, {
      data: { items: [{ externalId }], ignoreUnknownIds: true },
      headers: BETA_API_HEADERS,
    });

    return parseFoundAgent(response.data);
  };

  chat = async ({ agentExternalId, text, cursor }: AgentChatRequest): Promise<AgentReply> => {
    const response = await this.sdk.post<unknown>(`${this.agentsPath}/chat`, {
      data: {
        agentExternalId,
        messages: [{ role: USER_MESSAGE_ROLE, content: { type: TEXT_MESSAGE_CONTENT_TYPE, text } }],
        ...(cursor === null ? {} : { cursor }),
      },
      headers: BETA_API_HEADERS,
    });

    return parseReply(response.data);
  };
}

export function createAgentContext(sdk: AgentSdkClient): AgentContextType {
  return new CdfAgentContext(sdk);
}

function parseReply(data: unknown): AgentReply {
  const reply = AgentReplyResponseSchema.safeParse(data);
  if (!reply.success) {
    throw new Error(UNEXPECTED_REPLY_MESSAGE);
  }

  const agentMessages = reply.data.response.messages.flatMap((message) => {
    const parsed = AgentMessageSchema.safeParse(message);
    return parsed.success && parsed.data.role !== USER_MESSAGE_ROLE ? [parsed.data] : [];
  });
  const text = agentMessages
    .map((message) => nonBlankText(message.content?.text))
    .filter((part): part is string => part !== null)
    .join('\n\n');

  if (text === '') {
    throw new Error(
      agentMessages.some((message) => (message.actions?.length ?? 0) > 0)
        ? APPROVAL_NOT_SUPPORTED_MESSAGE
        : NO_REPLY_MESSAGE,
    );
  }

  const { cursor } = reply.data.response;
  return {
    text,
    cursor: typeof cursor === 'string' && cursor !== '' ? cursor : null,
  };
}

function parseFoundAgent(data: unknown): CdfAgent | null {
  const response = AgentListResponseSchema.safeParse(data);
  if (!response.success) {
    throw new Error(UNEXPECTED_AGENT_MESSAGE);
  }

  for (const item of response.data.items) {
    const agent = AgentSchema.safeParse(item);
    if (agent.success) {
      const { externalId, name, description } = agent.data;

      return {
        externalId,
        name: nonBlankText(name) ?? externalId,
        description: nonBlankText(description),
      };
    }
  }
  return null;
}

function nonBlankText(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const text = value.trim();
  return text === '' ? null : text;
}
