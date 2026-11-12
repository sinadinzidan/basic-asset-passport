import { CogniteError } from '@cognite/sdk';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../__mocks__/agents';
import { AgentStatus } from '../AgentStatus';

import { makeAgentWrapper } from './AgentTestHarness';

describe(AgentStatus.name, () => {
  it('asks the panel to close', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AgentStatus onClose={onClose} />, {
      wrapper: makeAgentWrapper({ client: makeAgentContext() }),
    });

    await user.click(screen.getByRole('button', { name: 'Close assistant' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("is titled with the assistant's name", () => {
    render(<AgentStatus onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client: makeAgentContext() }),
    });

    expect(screen.getByRole('heading', { name: 'Dalil AI' })).toBeVisible();
  });

  it('shows a loading status while the assistant is looked up', () => {
    const client = makeAgentContext({ getAgent: () => new Promise(() => {}) });
    render(<AgentStatus onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client }),
    });

    expect(screen.getByRole('status')).toHaveTextContent('Loading assistant...');
  });

  it('shows a retryable error when the agent cannot be looked up', async () => {
    const getAgent = vi
      .fn()
      .mockRejectedValueOnce(new Error('no access'))
      .mockResolvedValue(makeCdfAgent());
    const user = userEvent.setup();
    render(<AgentStatus onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client: makeAgentContext({ getAgent }) }),
    });

    expect(await screen.findByText('The assistant could not be loaded')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await vi.waitFor(() => expect(getAgent).toHaveBeenCalledTimes(2));
  });

  it('shows the reason CDF gave when the agent cannot be looked up', async () => {
    const client = makeAgentContext({
      getAgent: () =>
        Promise.reject(
          new CogniteError(
            'Insufficient access rights. Required capabilities groupsAcl:LIST, projectsAcl:LIST not present on token',
            403,
            'request-1',
          ),
        ),
    });
    render(<AgentStatus onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client }),
    });

    expect(
      await screen.findByText(
        'Reason: Insufficient access rights. Required capabilities groupsAcl:LIST, projectsAcl:LIST not present on token (HTTP 403)',
      ),
    ).toBeVisible();
    expect(
      screen.getByText('Check access to the agents of this project, then try again.'),
    ).toBeVisible();
  });

  it('says so when the project does not have the assistant', async () => {
    const client = makeAgentContext({
      getAgent: () => Promise.resolve(null),
    });
    render(<AgentStatus onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client }),
    });

    expect(
      await screen.findByText('The assistant is not available in this project.'),
    ).toBeVisible();
  });
});
