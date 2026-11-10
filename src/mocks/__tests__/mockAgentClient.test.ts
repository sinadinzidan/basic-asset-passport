import { describe, expect, it } from 'vitest';

import { FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';
import { makeMockAgentClient } from '../mockAgentClient';

describe(makeMockAgentClient.name, () => {
  it('has the focused agent with a name and description', async () => {
    const agent = await makeMockAgentClient(0).getAgent(
      FOCUSED_AGENT_EXTERNAL_ID,
    );

    expect(agent?.externalId).toBe(FOCUSED_AGENT_EXTERNAL_ID);
    expect(agent?.name).not.toBe('');
    expect(agent?.description).not.toBeNull();
  });

  it('has no other agent', async () => {
    await expect(
      makeMockAgentClient(0).getAgent('something-else'),
    ).resolves.toBeNull();
  });

  it('answers a question as the chosen agent and says it is dummy data', async () => {
    const client = makeMockAgentClient(0);
    const agent = await client.getAgent(FOCUSED_AGENT_EXTERNAL_ID);

    const reply = await client.chat({
      agentExternalId: agent?.externalId ?? '',
      text: 'Why is pump 1 hot?',
      cursor: null,
    });

    expect(reply.text).toContain(agent?.name);
    expect(reply.text).toContain('Why is pump 1 hot?');
    expect(reply.text).toContain('dummy');
  });

  it('keeps a conversation going with a cursor', async () => {
    const client = makeMockAgentClient(0);
    const request = { agentExternalId: FOCUSED_AGENT_EXTERNAL_ID, text: 'Hi' };

    const first = await client.chat({ ...request, cursor: null });
    const second = await client.chat({ ...request, cursor: first.cursor });

    expect(first.cursor).not.toBeNull();
    expect(second.cursor).not.toBe(first.cursor);
  });
});
