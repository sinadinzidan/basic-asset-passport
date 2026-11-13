import type { CogniteClient } from '@cognite/sdk';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../../__mocks__/cogniteClient';
import { makeCogniteSdkWrapper } from '../../../__mocks__/CogniteSdkWrapper';
import { useAgentClient } from '../../../hooks/agents/useAgentClient';
import type { AgentContextType } from '../../../types/agent';
import { AgentProvider } from '../AgentProvider';

describe(AgentProvider.name, () => {
  let client: CogniteClient;
  let seenContexts: AgentContextType[];

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
    seenContexts = [];
  });

  function AgentProbe() {
    const agentContext = useAgentClient();

    seenContexts.push(agentContext);

    return <p>Agents of {agentContext.project}</p>;
  }

  function renderProvider() {
    return render(
      <AgentProvider>
        <AgentProbe />
      </AgentProvider>,
      { wrapper: makeCogniteSdkWrapper(client) },
    );
  }

  it('gives its children the agents of the signed-in project', async () => {
    renderProvider();

    expect(await screen.findByText('Agents of my-project')).toBeInTheDocument();
  });

  it('asks about agents with the signed-in client', async () => {
    const post = vi
      .spyOn(client, 'post')
      .mockResolvedValue({ data: { items: [] }, status: 200, headers: {} });

    renderProvider();
    await screen.findByText('Agents of my-project');

    await seenContexts[0]?.getAgent('cooling-expert');

    expect(post).toHaveBeenCalledWith(
      '/api/v1/projects/my-project/ai/agents/byids',
      expect.objectContaining({
        data: { items: [{ externalId: 'cooling-expert' }], ignoreUnknownIds: true },
      }),
    );
  });

  it('keeps handing out the same context while the client stays the same', async () => {
    const { rerender } = renderProvider();

    await screen.findByText('Agents of my-project');

    rerender(
      <AgentProvider>
        <AgentProbe />
      </AgentProvider>,
    );

    expect(new Set(seenContexts).size).toBe(1);
  });
});
