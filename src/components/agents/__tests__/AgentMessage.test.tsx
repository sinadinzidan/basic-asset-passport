import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatMessageRole } from '../../../enums/chatMessageRole';
import { UseCopyToClipboardContext } from '../../../hooks/general/useCopyToClipboard';
import type { ChatMessage } from '../../../types/agent';
import { AgentMessage } from '../AgentMessage';

const reply: ChatMessage = { id: 'm-1', role: ChatMessageRole.AGENT, text: 'Two pumps.' };
const question: ChatMessage = { id: 'm-2', role: ChatMessageRole.USER, text: 'How many?' };

describe(AgentMessage.name, () => {
  it('shows the text of the message', () => {
    renderMessage(question);

    expect(screen.getByText('How many?')).toBeVisible();
  });

  it('offers to copy only what the agent said', () => {
    renderMessage(question);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it("offers the copy as the app's icon button", () => {
    renderMessage(reply);

    const button = screen.getByRole('button', { name: 'Copy response' });
    expect(button).toHaveClass('hud-button');
    expect(button).toHaveAttribute('data-size', 'icon-sm');
  });

  it('says what the button does in a tooltip when it is focused', async () => {
    const user = userEvent.setup();
    renderMessage(reply);

    await user.tab();

    expect(await screen.findByText('Copy response')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy response' })).not.toHaveAttribute('title');
  });

  it('copies the reply and says so', async () => {
    const user = userEvent.setup();
    const { writeText } = renderMessage(reply);

    await user.click(screen.getByRole('button', { name: 'Copy response' }));

    expect(writeText).toHaveBeenCalledWith('Two pumps.');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();
  });

  it('says when the reply could not be copied', async () => {
    const user = userEvent.setup();
    renderMessage(
      reply,
      vi.fn(() => Promise.reject(new Error('blocked'))),
    );

    await user.click(screen.getByRole('button', { name: 'Copy response' }));

    expect(await screen.findByRole('button', { name: 'Could not copy' })).toBeVisible();
  });
});

function renderMessage(
  message: ChatMessage,
  writeText: (text: string) => Promise<void> = vi.fn(() => Promise.resolve()),
) {
  render(
    <UseCopyToClipboardContext.Provider
      // The confirmation never times out, so the test sees it.
      value={{ writeText, startTimeout: () => () => {} }}
    >
      <AgentMessage message={message} />
    </UseCopyToClipboardContext.Provider>,
  );

  return { writeText };
}
