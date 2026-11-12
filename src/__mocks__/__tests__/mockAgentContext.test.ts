import { describe, expect, it } from 'vitest';

import { makeMockAgentContext, MOCK_AGENT_UNAVAILABLE_MESSAGE } from '../mockAgentContext';
import { MOCK_PROJECT } from '../mockAssetContext';

describe(makeMockAgentContext.name, () => {
  it('belongs to the mock project', () => {
    expect(makeMockAgentContext().project).toBe(MOCK_PROJECT);
  });

  it('finds no agent, so the assistant shows as not available', async () => {
    await expect(makeMockAgentContext().getAgent('any-agent')).resolves.toBeNull();
  });

  it('refuses to chat', async () => {
    const request = { agentExternalId: 'any-agent', text: 'Hello', cursor: null };

    await expect(makeMockAgentContext().chat(request)).rejects.toThrow(
      MOCK_AGENT_UNAVAILABLE_MESSAGE,
    );
  });
});
