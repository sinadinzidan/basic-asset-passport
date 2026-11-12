import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SAMPLE_QUESTIONS } from '../../../constants/agents';
import { DictationFailure } from '../../../enums/dictationFailure';
import { makeAgentContext, makeCdfAgent } from '../../../mocks/agents';
import type { AgentContextType } from '../../../types/agent';
import type { DictationCallbacks, DictationEngine } from '../../../types/speech';
import { AgentChat } from '../AgentChat';

import { makeAgentWrapper } from './AgentTestHarness';

describe(AgentChat.name, () => {
  let chat: AgentContextType['chat'];
  let onClose: () => void;

  beforeEach(() => {
    onClose = vi.fn();
    chat = vi.fn(() => Promise.resolve({ text: 'The strainer is fouled.', cursor: 'c1' }));
  });

  function renderChat(
    dictationEngine: DictationEngine | null = null,
    copyText?: (text: string) => Promise<void>,
  ) {
    return render(<AgentChat onClose={onClose} />, {
      wrapper: makeAgentWrapper({
        client: makeAgentContext({ chat }),
        loadedAgent: makeCdfAgent(),
        dictationEngine,
        copyText,
      }),
    });
  }

  it("is titled with the assistant's name and invites a first question", () => {
    renderChat();

    expect(screen.getByRole('heading', { name: 'Dalil AI' })).toBeVisible();
    expect(screen.getByText('Ask Dalil AI something.')).toBeVisible();
  });

  it('suggests sample questions in an empty chat', () => {
    renderChat();

    for (const question of SAMPLE_QUESTIONS) {
      expect(screen.getByRole('button', { name: question })).toBeVisible();
    }
  });

  it("offers each sample question as the app's button", () => {
    renderChat();

    for (const question of SAMPLE_QUESTIONS) {
      expect(screen.getByRole('button', { name: question })).toHaveClass('hud-button');
    }
  });

  it('sends a sample question when it is chosen', async () => {
    const user = userEvent.setup();
    renderChat();
    const question = SAMPLE_QUESTIONS[0];

    await user.click(screen.getByRole('button', { name: question }));

    expect(chat).toHaveBeenCalledWith(expect.objectContaining({ text: question }));
    expect(
      await within(screen.getByRole('log')).findByText('The strainer is fouled.'),
    ).toBeVisible();
  });

  it('stops suggesting once the conversation has started', async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: SAMPLE_QUESTIONS[1] }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: SAMPLE_QUESTIONS[0] })).not.toBeInTheDocument(),
    );
  });

  it('shows the question and the reply, and clears the box', async () => {
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Why is pump 1 hot?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    const log = screen.getByRole('log');
    expect(within(log).getByText('Why is pump 1 hot?')).toBeVisible();
    expect(await within(log).findByText('The strainer is fouled.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  });

  it('sends with Enter but keeps a new line for Shift+Enter', async () => {
    const user = userEvent.setup();
    renderChat();
    const box = screen.getByRole('textbox', { name: 'Message' });

    await user.type(box, 'Line one{Shift>}{Enter}{/Shift}Line two');
    expect(chat).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');

    expect(chat).toHaveBeenCalledWith(expect.objectContaining({ text: 'Line one\nLine two' }));
  });

  it('does not send on the Enter that confirms a composed character', async () => {
    const user = userEvent.setup();
    renderChat();
    const box = screen.getByRole('textbox', { name: 'Message' });
    await user.type(box, 'にほん');

    fireEvent.keyDown(box, { key: 'Enter', isComposing: true });

    expect(chat).not.toHaveBeenCalled();
    expect(box).toHaveValue('にほん');
  });

  it('labels the message box with a visible label', () => {
    renderChat();

    expect(screen.getByText('Message', { selector: 'label' })).toBeVisible();
    expect(screen.getByLabelText('Message')).toBe(screen.getByRole('textbox'));
  });

  it('cannot send an empty question', () => {
    renderChat();

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows that the agent is thinking and blocks another question meanwhile', async () => {
    vi.mocked(chat).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Thinking...');
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'More');
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('says why the agent could not answer', async () => {
    vi.mocked(chat).mockRejectedValue(new Error('forbidden'));
    const user = userEvent.setup();
    renderChat();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The agent could not answer');
    expect(screen.getByRole('alert')).toHaveTextContent('forbidden');
    expect(screen.getByText('Hi')).toBeVisible();
  });

  it('asks the question again when Retry is pressed after a failed answer', async () => {
    // Arrange
    vi.mocked(chat).mockRejectedValueOnce(new Error('forbidden'));
    const user = userEvent.setup();
    renderChat();
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    // Act
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    // Assert
    expect(await screen.findByText('The strainer is fouled.')).toBeVisible();
    expect(screen.getAllByText('Hi')).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it('starts a new chat', async () => {
    const user = userEvent.setup();
    renderChat();
    const newChat = screen.getByRole('button', { name: 'New chat' });
    expect(newChat).toBeDisabled();
    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('The strainer is fouled.');

    await user.click(newChat);

    await waitFor(() =>
      expect(screen.queryByText('The strainer is fouled.')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Ask Dalil AI something.')).toBeVisible();
  });

  it('closes the panel', async () => {
    const user = userEvent.setup();
    renderChat();

    await user.click(screen.getByRole('button', { name: 'Close assistant' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('copying a reply', () => {
    async function askAndWaitForReply(user: ReturnType<typeof userEvent.setup>) {
      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Why?');
      await user.click(screen.getByRole('button', { name: 'Send' }));
      await within(screen.getByRole('log')).findByText('The strainer is fouled.');
    }

    it('has a copy button on the agent reply but not on the question', async () => {
      const user = userEvent.setup();
      renderChat();

      await askAndWaitForReply(user);

      expect(screen.getAllByRole('button', { name: 'Copy response' })).toHaveLength(1);
    });

    it('copies the text of the reply and confirms it', async () => {
      const user = userEvent.setup();
      const copyText = vi.fn(() => Promise.resolve());
      renderChat(null, copyText);
      await askAndWaitForReply(user);

      await user.click(screen.getByRole('button', { name: 'Copy response' }));

      expect(copyText).toHaveBeenCalledWith('The strainer is fouled.');
      expect(await screen.findByRole('button', { name: 'Copied' })).toBeVisible();
    });

    it('says when the reply could not be copied', async () => {
      const user = userEvent.setup();
      renderChat(null, () => Promise.reject(new Error('denied')));
      await askAndWaitForReply(user);

      await user.click(screen.getByRole('button', { name: 'Copy response' }));

      expect(await screen.findByRole('button', { name: 'Could not copy' })).toBeVisible();
    });
  });

  describe('dictation', () => {
    let callbacks: DictationCallbacks;
    let stopSession: () => void;
    let engine: DictationEngine;

    beforeEach(() => {
      stopSession = vi.fn();
      engine = {
        start: vi.fn((given) => {
          callbacks = given;
          return { stop: stopSession };
        }),
      };
    });

    it('has no microphone button when the browser cannot recognise speech', () => {
      renderChat(null);

      expect(screen.queryByRole('button', { name: 'Start dictation' })).not.toBeInTheDocument();
    });

    it('shows a microphone while idle and a stop sign while listening', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      const start = screen.getByRole('button', { name: 'Start dictation' });
      expect(start.querySelector('.tabler-icon-microphone')).not.toBeNull();

      await user.click(start);

      const stop = screen.getByRole('button', { name: 'Stop dictation' });
      expect(stop.querySelector('.tabler-icon-player-stop-filled')).not.toBeNull();
      expect(stop.querySelector('.tabler-icon-microphone')).toBeNull();
    });

    it('types what is said into the message box as it is heard', async () => {
      const user = userEvent.setup();
      renderChat(engine);

      await user.click(screen.getByRole('button', { name: 'Start dictation' }));
      act(() => callbacks.onTranscript('which pumps'));
      act(() => callbacks.onTranscript('which pumps are leaking'));

      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
        'which pumps are leaking',
      );
      expect(screen.getByRole('button', { name: 'Stop dictation' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('adds the spoken words after what was already typed', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Check');

      await user.click(screen.getByRole('button', { name: 'Start dictation' }));
      act(() => callbacks.onTranscript('the strainer'));

      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Check the strainer');
    });

    it('stops listening when the microphone button is pressed again', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.click(screen.getByRole('button', { name: 'Start dictation' }));

      await user.click(screen.getByRole('button', { name: 'Stop dictation' }));

      expect(stopSession).toHaveBeenCalled();
    });

    it('stops listening and sends the dictated question', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.click(screen.getByRole('button', { name: 'Start dictation' }));
      act(() => callbacks.onTranscript('which pumps leak'));

      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(stopSession).toHaveBeenCalled();
      expect(chat).toHaveBeenCalledWith(expect.objectContaining({ text: 'which pumps leak' }));
    });

    it('does not refill the message box with words recognised after sending', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.click(screen.getByRole('button', { name: 'Start dictation' }));
      act(() => callbacks.onTranscript('which pumps leak'));
      await user.click(screen.getByRole('button', { name: 'Send' }));

      act(() => callbacks.onTranscript('which pumps leak today'));

      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('');
    });

    it('stops dictating when the message is edited by hand, and keeps the edit', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.click(screen.getByRole('button', { name: 'Start dictation' }));
      act(() => callbacks.onTranscript('which pumps'));

      await user.type(screen.getByRole('textbox', { name: 'Message' }), ' leak');
      act(() => callbacks.onTranscript('which pumps are'));

      expect(stopSession).toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('which pumps leak');
    });

    it('explains when the microphone is blocked', async () => {
      const user = userEvent.setup();
      renderChat(engine);
      await user.click(screen.getByRole('button', { name: 'Start dictation' }));

      act(() => callbacks.onError(DictationFailure.BLOCKED));
      act(() => callbacks.onEnd());

      expect(
        await screen.findByText(
          'Microphone access is blocked. Allow it in the browser to dictate.',
        ),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'Start dictation' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });
});
