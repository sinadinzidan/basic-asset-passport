import { buttonVariants } from '@cognite/aura/components/button';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PanelPhase } from '../../../enums/panelPhase';
import { makeAgentContext } from '../../../mocks/agents';
import type { AgentContextType } from '../../../types/agent';
import type { StateSyncApi } from '../../../types/host';
import { AgentHelper } from '../AgentHelper';

import { makeAgentWrapper } from './AgentTestHarness';

const GREETING = "Hi, I'm Dalil AI, your assistant";

describe(AgentHelper.name, () => {
  let client: AgentContextType;

  beforeEach(() => {
    client = makeAgentContext();
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

  async function openPanel() {
    const user = userEvent.setup();
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });
    await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));
    return user;
  }

  it('offers a button that names the helper for assistive technology', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toBeVisible();
  });

  it('makes the mascot an Aura ghost button', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveClass(
      ...buttonVariants({ variant: 'ghost' }).split(' '),
    );
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

  it('waves the mascot only while it greets, and when it is hovered or focused', async () => {
    const user = userEvent.setup();
    const { container } = render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });
    const mascot = container.querySelector('.agent-mascot');
    expect(mascot).toHaveAttribute('data-waving', 'false');

    await user.tab();

    await waitFor(() => expect(mascot).toHaveAttribute('data-waving', 'true'));
    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveClass(
      'agent-mascot-wave-on-hover',
    );
  });

  it('greets by itself shortly after the app opens, then stops', async () => {
    const waits = renderWithGreetingWaits();

    act(() => waits.finish());

    expect(await screen.findByText(GREETING)).toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'true');

    act(() => waits.finish());

    await waitFor(() => expect(screen.queryByText(GREETING)).not.toBeInTheDocument());
    expect(helper()).toHaveAttribute('data-greeting', 'false');
  });

  it('keeps greeting past the first greeting while the pointer stays on the mascot', async () => {
    const user = userEvent.setup();
    const waits = renderWithGreetingWaits();
    act(() => waits.finish());
    await screen.findByText(GREETING);

    await user.hover(screen.getByRole('button', { name: 'Dalil AI assistant' }));
    act(() => waits.finish());

    expect(screen.getByText(GREETING)).toBeInTheDocument();
    expect(helper()).toHaveAttribute('data-greeting', 'true');
  });

  it('stops greeting when the panel opens', async () => {
    const user = userEvent.setup();
    const waits = renderWithGreetingWaits();
    act(() => waits.finish());
    await screen.findByText(GREETING);

    await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));

    await waitFor(() => expect(screen.queryByText(GREETING)).not.toBeInTheDocument());
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(helper()).toHaveAttribute('data-greeting', 'false');
  });

  it('starts closed: nothing is looked up and the button is collapsed', () => {
    render(<AgentHelper />, { wrapper: makeAgentWrapper({ client }) });

    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(client.getAgent).not.toHaveBeenCalled();
  });

  it('opens a panel that the mascot button controls', async () => {
    await openPanel();

    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('dialog', { name: 'Dalil AI assistant' })).toBeVisible();
  });

  it.each([
    [
      'the mascot button',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Dalil AI assistant' })),
    ],
    [
      'the close button',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Close assistant' })),
    ],
    ['Escape', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
  ])('closes with %s', async (_name, close) => {
    const user = await openPanel();

    await close(user);
    await finishClosing();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps the panel on screen until its exit animation ends', async () => {
    const user = await openPanel();

    await user.click(screen.getByRole('button', { name: 'Close assistant' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-phase', PanelPhase.CLOSING);
    await finishClosing();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a loading status while the assistant is looked up', async () => {
    vi.mocked(client.getAgent).mockReturnValue(new Promise(() => {}));

    await openPanel();

    expect(await screen.findByRole('status')).toHaveTextContent('Loading assistant...');
  });

  it('opens a chat with the assistant by itself, looking up only that agent', async () => {
    await openPanel();

    expect(await screen.findByRole('heading', { name: 'Dalil AI' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeVisible();
    expect(client.getAgent).toHaveBeenCalledWith('cooling-expert');
  });

  it('comes back to the same conversation after the helper is closed', async () => {
    const user = await openPanel();
    await screen.findByRole('heading', { name: 'Dalil AI' });
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Hello!');

    await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));
    await finishClosing();
    await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));

    expect(await screen.findByText('Hello!')).toBeVisible();
  });

  describe('keeping the panel open across a reload', () => {
    let api: StateSyncApi;

    beforeEach(() => {
      api = {
        syncInternalState: vi.fn<StateSyncApi['syncInternalState']>(() => Promise.resolve(true)),
      };
    });

    it('syncs that the panel is open when it opens', async () => {
      const user = userEvent.setup();
      render(<AgentHelper />, { wrapper: makeAgentWrapper({ client, hostApi: api }) });

      await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));

      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        expect.stringContaining('"isAssistantOpen":true'),
      );
    });

    it('syncs that the panel is closed when it closes', async () => {
      const user = userEvent.setup();
      render(<AgentHelper />, { wrapper: makeAgentWrapper({ client, hostApi: api }) });
      await user.click(screen.getByRole('button', { name: 'Dalil AI assistant' }));

      await user.click(screen.getByRole('button', { name: 'Close assistant' }));

      expect(api.syncInternalState).toHaveBeenLastCalledWith(
        expect.not.stringContaining('isAssistantOpen'),
      );
    });

    it('comes back open when the host restores an open panel', () => {
      render(<AgentHelper />, {
        wrapper: makeAgentWrapper({
          client,
          hostApi: api,
          hostInitialState: JSON.stringify({ isAssistantOpen: true }),
        }),
      });

      expect(screen.getByRole('dialog', { name: 'Dalil AI assistant' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Dalil AI assistant' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });
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
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
}
