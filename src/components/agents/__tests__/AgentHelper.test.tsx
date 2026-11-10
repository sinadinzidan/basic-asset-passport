import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentClient } from '../../../mocks/agents';
import type { AgentClient } from '../../../types/agent';
import { AgentHelper } from '../AgentHelper';


import { makeAgentWrapper } from './agentTestHarness';

describe(AgentHelper.name, () => {
  let client: AgentClient;

  beforeEach(() => {
    client = makeAgentClient();
    client.getAgent = vi.fn(client.getAgent);
  });

  async function openPicker() {
    const user = userEvent.setup();
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });
    await user.click(screen.getByRole('button', { name: 'AI assistant' }));
    return user;
  }

  it('offers a button that names the helper for assistive technology', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'AI assistant' })).toBeVisible();
  });

  it('starts closed: nothing is looked up and the button is collapsed', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(client.getAgent).not.toHaveBeenCalled();
  });

  it('opens a panel that the mascot button controls', async () => {
    await openPicker();

    expect(screen.getByRole('button', { name: 'AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('dialog', { name: 'AI assistant' })).toBeVisible();
  });

  it.each([
    [
      'the mascot button',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'AI assistant' })),
    ],
    [
      'the close button',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Close agents' })),
    ],
    [
      'Escape',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.keyboard('{Escape}'),
    ],
  ])('closes with %s', async (_name, close) => {
    const user = await openPicker();

    await close(user);
    await finishClosing();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps the panel on screen until its exit animation ends', async () => {
    const user = await openPicker();

    await user.click(screen.getByRole('button', { name: 'Close agents' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-phase', 'CLOSING');
    await finishClosing();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a loading status while the assistant is looked up', async () => {
    vi.mocked(client.getAgent).mockReturnValue(new Promise(() => {}));

    await openPicker();

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Loading assistant...',
    );
  });

  it('opens a chat with the assistant by itself, looking up only that agent', async () => {
    await openPicker();

    expect(
      await screen.findByRole('heading', { name: 'Cooling expert' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeVisible();
    expect(client.getAgent).toHaveBeenCalledWith('cooling-expert');
  });

  it('comes back to the same conversation after the helper is closed', async () => {
    const user = await openPicker();
    await screen.findByRole('heading', { name: 'Cooling expert' });
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Hello!');

    await user.click(screen.getByRole('button', { name: 'AI assistant' }));
    await finishClosing();
    await user.click(screen.getByRole('button', { name: 'AI assistant' }));

    expect(await screen.findByText('Hello!')).toBeVisible();
  });
});

/** Browsers fire this when the exit animation ends; jsdom runs no animations. */
async function finishClosing(): Promise<void> {
  const panel = screen.queryByRole('dialog');
  if (panel !== null) fireEvent.animationEnd(panel);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}
