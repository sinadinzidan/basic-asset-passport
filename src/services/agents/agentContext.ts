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
import { isRecord } from '../../lib/isRecord';
import type { AgentChatRequest, AgentContextType, AgentReply, CdfAgent } from '../../types/agent';

type AgentSdkClient = Pick<CogniteClient, 'project' | 'get' | 'post'>;

export function createAgentContext(sdk: AgentSdkClient): AgentContextType {
  const agentsPath = `/api/v1/projects/${encodeURIComponent(sdk.project)}/ai/agents`;

  return {
    project: sdk.project,
    async getAgent(externalId: string) {
      const response = await sdk.post<unknown>(`${agentsPath}/byids`, {
        data: { items: [{ externalId }], ignoreUnknownIds: true },
        headers: BETA_API_HEADERS,
      });

      return parseFoundAgent(response.data);
    },
    async chat({ agentExternalId, text, cursor }: AgentChatRequest) {
      const response = await sdk.post<unknown>(`${agentsPath}/chat`, {
        data: {
          agentExternalId,
          messages: [
            { role: USER_MESSAGE_ROLE, content: { type: TEXT_MESSAGE_CONTENT_TYPE, text } },
          ],
          ...(cursor === null ? {} : { cursor }),
        },
        headers: BETA_API_HEADERS,
      });

      return parseReply(response.data);
    },
  };
}

function parseReply(data: unknown): AgentReply {
  if (!isRecord(data) || !isRecord(data.response) || !Array.isArray(data.response.messages)) {
    throw new Error(UNEXPECTED_REPLY_MESSAGE);
  }

  const agentMessages = data.response.messages.filter(
    (message): message is Record<string, unknown> =>
      isRecord(message) && message.role !== USER_MESSAGE_ROLE,
  );
  const text = agentMessages
    .map((message) => (isRecord(message.content) ? nonBlankText(message.content.text) : null))
    .filter((part): part is string => part !== null)
    .join('\n\n');

  if (text === '') {
    throw new Error(
      agentMessages.some(asksForAction) ? APPROVAL_NOT_SUPPORTED_MESSAGE : NO_REPLY_MESSAGE,
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
