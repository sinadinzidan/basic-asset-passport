import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../../mocks/cogniteClient';
import { createAgentContext } from '../agentContext';

describe(createAgentContext.name, () => {
  let sdk: CogniteClient;

  beforeEach(() => {
    sdk = makeOfflineSdkClient('my-project');
  });

  function respondWith(data: unknown) {
    return vi.spyOn(sdk, 'post').mockResolvedValue({ data, status: 200, headers: {} });
  }

  it('reports the project the agents belong to', () => {
    expect(createAgentContext(sdk).project).toBe('my-project');
  });

  describe('getAgent', () => {
    it('asks the Agents API for that one agent only', async () => {
      // Arrange
      const post = respondWith({ items: [] });

      // Act
      await createAgentContext(sdk).getAgent('cooling-expert');

      // Assert
      expect(post).toHaveBeenCalledWith('/api/v1/projects/my-project/ai/agents/byids', {
        data: {
          items: [{ externalId: 'cooling-expert' }],
          ignoreUnknownIds: true,
        },
        headers: { 'cdf-version': 'beta' },
      });
    });

    it('returns the agent with its name and description', async () => {
      respondWith({
        items: [
          {
            externalId: 'cooling-expert',
            name: 'Cooling expert',
            description: 'Answers questions about cooling systems.',
            model: 'gpt-5',
          },
        ],
      });

      await expect(createAgentContext(sdk).getAgent('cooling-expert')).resolves.toEqual({
        externalId: 'cooling-expert',
        name: 'Cooling expert',
        description: 'Answers questions about cooling systems.',
      });
    });

    it('is null when the project has no such agent', async () => {
      respondWith({ items: [] });

      await expect(createAgentContext(sdk).getAgent('missing')).resolves.toBeNull();
    });

    it('uses the external ID when the agent has no name', async () => {
      respondWith({ items: [{ externalId: 'unnamed-agent', name: '  ' }] });

      const agent = await createAgentContext(sdk).getAgent('unnamed-agent');

      expect(agent?.name).toBe('unnamed-agent');
    });

    it('has no description when it is missing or blank', async () => {
      respondWith({ items: [{ externalId: 'a', name: 'A', description: ' ' }] });

      const agent = await createAgentContext(sdk).getAgent('a');

      expect(agent?.description).toBeNull();
    });

    it('skips entries that are not agents', async () => {
      respondWith({
        items: [null, 'text', { name: 'No ID' }, { externalId: '', name: '' }],
      });

      await expect(createAgentContext(sdk).getAgent('a')).resolves.toBeNull();
    });

    it('fails when the response is not a list of agents', async () => {
      respondWith({ message: 'unexpected' });

      await expect(createAgentContext(sdk).getAgent('a')).rejects.toThrow(
        'CDF returned an agent in an unexpected shape.',
      );
    });

    it('propagates a rejected request', async () => {
      vi.spyOn(sdk, 'post').mockRejectedValue(new Error('forbidden'));

      await expect(createAgentContext(sdk).getAgent('a')).rejects.toThrow('forbidden');
    });
  });

  describe('chat', () => {
    function replyWith(response: unknown) {
      return vi.spyOn(sdk, 'post').mockResolvedValue({
        data: { agentExternalId: 'cooling-expert', response },
        status: 200,
        headers: {},
      });
    }

    const request = {
      agentExternalId: 'cooling-expert',
      text: 'Why is pump 1 hot?',
      cursor: null,
    };

    it('sends the question to the agent and starts a new conversation', async () => {
      // Arrange
      const post = replyWith({ type: 'result', messages: [] });

      // Act
      await createAgentContext(sdk)
        .chat(request)
        .catch(() => undefined);

      // Assert
      expect(post).toHaveBeenCalledWith('/api/v1/projects/my-project/ai/agents/chat', {
        data: {
          agentExternalId: 'cooling-expert',
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: 'Why is pump 1 hot?' },
            },
          ],
        },
        headers: { 'cdf-version': 'beta' },
      });
    });

    it('continues the conversation with the cursor of the last reply', async () => {
      const post = replyWith({ type: 'result', messages: [] });

      await createAgentContext(sdk)
        .chat({ ...request, cursor: 'cursor-1' })
        .catch(() => undefined);

      expect(post.mock.calls[0]?.[1]?.data).toMatchObject({
        cursor: 'cursor-1',
      });
    });

    it('returns the text of the agent reply and the cursor', async () => {
      replyWith({
        type: 'result',
        cursor: 'cursor-2',
        messages: [{ role: 'agent', content: { type: 'text', text: ' It is fouled. ' } }],
      });

      await expect(createAgentContext(sdk).chat(request)).resolves.toEqual({
        text: 'It is fouled.',
        cursor: 'cursor-2',
      });
    });

    it('joins several agent messages and ignores the user messages', async () => {
      replyWith({
        type: 'result',
        messages: [
          { role: 'user', content: { type: 'text', text: 'echo' } },
          { role: 'agent', content: { type: 'text', text: 'First.' } },
          { role: 'agent', content: { type: 'text', text: 'Second.' } },
        ],
      });

      await expect(createAgentContext(sdk).chat(request)).resolves.toEqual({
        text: 'First.\n\nSecond.',
        cursor: null,
      });
    });

    it('explains that tool approvals are not supported when the agent only asks for one', async () => {
      replyWith({
        type: 'result',
        messages: [
          {
            role: 'agent',
            content: { type: 'text', text: '' },
            actions: [{ type: 'toolConfirmation', actionId: 'a1' }],
          },
        ],
      });

      await expect(createAgentContext(sdk).chat(request)).rejects.toThrow(
        'This agent needs approval to run a tool, which this chat cannot give.',
      );
    });

    it('fails when the agent sends no text', async () => {
      replyWith({ type: 'result', messages: [] });

      await expect(createAgentContext(sdk).chat(request)).rejects.toThrow(
        'The agent did not reply.',
      );
    });

    it('fails when the response is not an agent reply', async () => {
      vi.spyOn(sdk, 'post').mockResolvedValue({
        data: { message: 'unexpected' },
        status: 200,
        headers: {},
      });

      await expect(createAgentContext(sdk).chat(request)).rejects.toThrow(
        'CDF returned an agent reply in an unexpected shape.',
      );
    });

    it('propagates a rejected request', async () => {
      vi.spyOn(sdk, 'post').mockRejectedValue(new Error('forbidden'));

      await expect(createAgentContext(sdk).chat(request)).rejects.toThrow('forbidden');
    });
  });
});
