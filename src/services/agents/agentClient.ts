import type { CogniteClient } from '@cognite/sdk';

import type {
  AgentChatRequest,
  AgentClient,
  AgentReply,
  CdfAgent,
} from '../../types/agent';

type AgentSdkClient = Pick<CogniteClient, 'project' | 'get' | 'post'>;

const UNEXPECTED_AGENT_MESSAGE =
  'CDF returned an agent in an unexpected shape.';
const UNEXPECTED_REPLY_MESSAGE =
  'CDF returned an agent reply in an unexpected shape.';
const APPROVAL_NOT_SUPPORTED_MESSAGE =
  'This agent needs approval to run a tool, which this chat cannot give.';
const NO_REPLY_MESSAGE = 'The agent did not reply.';
const BETA_HEADERS = { 'cdf-version': 'beta' };

/** Looks up an agent of the project and chats with it through the Agents API (beta). */
export function createAgentClient(sdk: AgentSdkClient): AgentClient {
  const agentsPath = `/api/v1/projects/${encodeURIComponent(sdk.project)}/ai/agents`;

  return {
    project: sdk.project,
    async getAgent(externalId: string) {
      const response = await sdk.post<unknown>(`${agentsPath}/byids`, {
        data: { items: [{ externalId }], ignoreUnknownIds: true },
        headers: BETA_HEADERS,
      });

      return parseFoundAgent(response.data);
    },
    async chat({ agentExternalId, text, cursor }: AgentChatRequest) {
      const response = await sdk.post<unknown>(`${agentsPath}/chat`, {
        data: {
          agentExternalId,
          messages: [{ role: 'user', content: { type: 'text', text } }],
          ...(cursor === null ? {} : { cursor }),
        },
        headers: BETA_HEADERS,
      });

      return parseReply(response.data);
    },
  };
}

function parseReply(data: unknown): AgentReply {
  if (
    !isRecord(data) ||
    !isRecord(data.response) ||
    !Array.isArray(data.response.messages)
  ) {
    throw new Error(UNEXPECTED_REPLY_MESSAGE);
  }

  const agentMessages = data.response.messages.filter(
    (message): message is Record<string, unknown> =>
      isRecord(message) && message.role !== 'user',
  );
  const text = agentMessages
    .map((message) =>
      isRecord(message.content) ? nonBlankText(message.content.text) : null,
    )
    .filter((part): part is string => part !== null)
    .join('\n\n');

  if (text === '') {
    throw new Error(
      agentMessages.some(asksForAction)
        ? APPROVAL_NOT_SUPPORTED_MESSAGE
        : NO_REPLY_MESSAGE,
    );
  }

  const { cursor } = data.response;
  return {
    text,
    cursor: typeof cursor === 'string' && cursor !== '' ? cursor : null,
  };
}

function asksForAction(message: Record<string, unknown>): boolean {
  return Array.isArray(message.actions) && message.actions.length > 0;
}

function parseFoundAgent(data: unknown): CdfAgent | null {
  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new Error(UNEXPECTED_AGENT_MESSAGE);
  }

  for (const item of data.items) {
    const agent = parseAgent(item);
    if (agent !== null) return agent;
  }
  return null;
}

function parseAgent(item: unknown): CdfAgent | null {
  if (!isRecord(item)) return null;

  const { externalId, name, description } = item;
  if (typeof externalId !== 'string' || externalId === '') return null;

  return {
    externalId,
    name: nonBlankText(name) ?? externalId,
    description: nonBlankText(description),
  };
}

function nonBlankText(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const text = value.trim();
  return text === '' ? null : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
