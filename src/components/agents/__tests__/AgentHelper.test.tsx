import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentClient } from '../../../mocks/agents';
import type { AgentClient } from '../../../types/agent';
import { AgentHelper } from '../AgentHelper';


import { makeAgentWrapper } from './agentTestHarness';

const GREETING = "Hi, I'm Dalil, your assistant";

describe(AgentHelper.name, () => {
  let client: AgentClient;

  beforeEach(() => {
    client = makeAgentClient();
    client.getAgent = vi.fn(client.getAgent);
  });

  /** Renders the helper with its greeting waits held, so a test ends each one itself. */
  function renderWithGreetingWaits(): { finish: () => void } {
    let finishWait = (): void => {};
    render(<AgentHelper />, {
      wrapper: makeAgentWrapper({
        client,
        startGreetingTimeout: (onDone) => {
          finishWait = onDone;
          return () => {};
        },
      }),
    });
    return { finish: () => finishWait() };
  }

  async function openPicker() {
    const user = userEvent.setup();
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });
    await user.click(screen.getByRole('button', { name: 'Dalil, AI assistant' }));
    return user;
  }

  it('offers a button that names the helper for assistive technology', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'Dalil, AI assistant' })).toBeVisible();
  });

  it('does not greet before anyone points at the mascot', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.queryByText(GREETING)).not.toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'false');
  });

  it('greets by name when the mascot is focused', async () => {
    const user = userEvent.setup();
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    await user.tab();

    expect(await screen.findByText(GREETING)).toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'true');
  });

  it('greets by itself shortly after the app opens, then stops', async () => {
    const waits = renderWithGreetingWaits();

    act(() => waits.finish());

    expect(await screen.findByText(GREETING)).toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'true');

    act(() => waits.finish());

    await waitFor(() =>
      expect(screen.queryByText(GREETING)).not.toBeInTheDocument(),
    );
    expect(helper()).toHaveAttribute('data-greeting', 'false');
  });

  it('keeps greeting past the first greeting while the pointer stays on the mascot', async () => {
    const user = userEvent.setup();
    const waits = renderWithGreetingWaits();
    act(() => waits.finish());
    await screen.findByText(GREETING);

    await user.hover(
      screen.getByRole('button', { name: 'Dalil, AI assistant' }),
    );
    act(() => waits.finish());

    expect(screen.getByText(GREETING)).toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'true');
  });

  it('stops greeting when the panel opens', async () => {
    const user = userEvent.setup();
    const waits = renderWithGreetingWaits();
    act(() => waits.finish());
    await screen.findByText(GREETING);

    await user.click(screen.getByRole('button', { name: 'Dalil, AI assistant' }));

    await waitFor(() =>
      expect(screen.queryByText(GREETING)).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(helper()).toHaveAttribute('data-greeting', 'false');
  });

  it('starts closed: nothing is looked up and the button is collapsed', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'Dalil, AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(client.getAgent).not.toHaveBeenCalled();
  });

  it('opens a panel that the mascot button controls', async () => {
    await openPicker();

    expect(screen.getByRole('button', { name: 'Dalil, AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('dialog', { name: 'Dalil, AI assistant' })).toBeVisible();
  });

  it.each([
    [
      'the mascot button',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Dalil, AI assistant' })),
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
    expect(screen.getByRole('button', { name: 'Dalil, AI assistant' })).toHaveAttribute(
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
      await screen.findByRole('heading', { name: 'Dalil' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeVisible();
    expect(client.getAgent).toHaveBeenCalledWith('cooling-expert');
  });

  it('comes back to the same conversation after the helper is closed', async () => {
    const user = await openPicker();
    await screen.findByRole('heading', { name: 'Dalil' });
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Hello!');

    await user.click(screen.getByRole('button', { name: 'Dalil, AI assistant' }));
    await finishClosing();
    await user.click(screen.getByRole('button', { name: 'Dalil, AI assistant' }));

    expect(await screen.findByText('Hello!')).toBeVisible();
  });
});

function helper(): HTMLElement {
  const element = document.querySelector<HTMLElement>('.agent-helper');
  if (element === null) throw new Error('The helper is not rendered');
  return element;
}

/** Browsers fire this when the exit animation ends; jsdom runs no animations. */
async function finishClosing(): Promise<void> {
  const panel = screen.queryByRole('dialog');
  if (panel !== null) fireEvent.animationEnd(panel);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
}
