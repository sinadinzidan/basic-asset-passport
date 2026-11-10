import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeAgentClient, makeCdfAgent } from '../../../mocks/agents';
import { AgentPicker } from '../AgentPicker';

import { makeAgentWrapper } from './agentTestHarness';

describe(AgentPicker.name, () => {
  it('asks the panel to close', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AgentPicker onClose={onClose} />, {
      wrapper: makeAgentWrapper({ client: makeAgentClient() }),
    });

    await user.click(screen.getByRole('button', { name: 'Close agents' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows a loading status while the assistant is looked up', () => {
    const client = makeAgentClient({ getAgent: () => new Promise(() => {}) });
    render(<AgentPicker onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client }),
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading assistant...',
    );
  });

  it('shows a retryable error when the agent cannot be looked up', async () => {
    const getAgent = vi
      .fn()
      .mockRejectedValueOnce(new Error('no access'))
      .mockResolvedValue(makeCdfAgent());
    const user = userEvent.setup();
    render(<AgentPicker onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client: makeAgentClient({ getAgent }) }),
    });

    expect(
      await screen.findByText('The assistant could not be loaded'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await vi.waitFor(() => expect(getAgent).toHaveBeenCalledTimes(2));
  });

  it('says so when the project does not have the assistant', async () => {
    const client = makeAgentClient({
      getAgent: () => Promise.resolve(null),
    });
    render(<AgentPicker onClose={vi.fn()} />, {
      wrapper: makeAgentWrapper({ client }),
    });

    expect(
      await screen.findByText('The assistant is not available in this project.'),
    ).toBeVisible();
  });
});
