import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../__mocks__/agents';
import { makeAgentWrapper } from '../../../components/agents/__tests__/AgentTestHarness';
import type { AgentContextType } from '../../../types/agent';
import type { DictationCallbacks, DictationEngine } from '../../../types/speech';
import { useAgentComposerViewModel } from '../useAgentComposerViewModel';

describe(useAgentComposerViewModel.name, () => {
  let chat: AgentContextType['chat'];

  beforeEach(() => {
    chat = vi.fn(() => Promise.resolve({ text: 'It is fouled.', cursor: 'c1' }));
  });

  function renderViewModel(dictationEngine: DictationEngine | null = null) {
    return renderHook(() => useAgentComposerViewModel(), {
      wrapper: makeAgentWrapper({
        client: makeAgentContext({ chat }),
        loadedAgent: makeCdfAgent(),
        dictationEngine,
      }),
    });
  }

  it('starts with an empty draft that cannot be sent', () => {
    const { result } = renderViewModel();

    expect(result.current.draft).toBe('');
    expect(result.current.canSend).toBe(false);
    expect(result.current.canStartNewChat).toBe(false);
    expect(result.current.dictation.isSupported).toBe(false);
  });

  it('can send once something is written', () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDraft('Why is pump 1 hot?'));

    expect(result.current.draft).toBe('Why is pump 1 hot?');
    expect(result.current.canSend).toBe(true);
  });

  it('cannot send a draft of blanks', () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDraft('   '));

    expect(result.current.canSend).toBe(false);
  });

  it('sends the draft, clears it and shows the reply', async () => {
    const { result } = renderViewModel();

    act(() => result.current.changeDraft('Why is pump 1 hot?'));

    act(() => result.current.submit());

    expect(result.current.draft).toBe('');
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(chat).toHaveBeenCalledWith(expect.objectContaining({ text: 'Why is pump 1 hot?' }));
    expect(result.current.canStartNewChat).toBe(true);
  });

  it('asks a failed question again without writing it again', async () => {
    vi.mocked(chat).mockRejectedValueOnce(new Error('agent offline'));
    const { result } = renderViewModel();

    act(() => result.current.changeDraft('Why is pump 1 hot?'));
    act(() => result.current.submit());
    await waitFor(() => expect(result.current.errorMessage).toBe('agent offline'));

    act(() => result.current.retrySend());

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(chat).toHaveBeenCalledTimes(2);
    expect(result.current.errorMessage).toBeNull();
  });

  it('sends nothing when the draft is empty', () => {
    const { result } = renderViewModel();

    act(() => result.current.submit());

    expect(chat).not.toHaveBeenCalled();
  });

  it('sends a sample question as it is', async () => {
    const { result } = renderViewModel();

    act(() => result.current.sendSample('Which assets have notes?'));

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(chat).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Which assets have notes?' }),
    );
  });

  it('starts a new chat that empties the conversation', async () => {
    const { result } = renderViewModel();

    act(() => result.current.sendSample('Hi'));
    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    act(() => result.current.startNewChat());

    expect(result.current.messages).toEqual([]);
  });

  it('adds dictated words after what was typed', () => {
    let callbacks: DictationCallbacks | undefined;
    const engine: DictationEngine = {
      start: (given) => {
        callbacks = given;

        return { stop: () => given.onEnd() };
      },
    };
    const { result } = renderViewModel(engine);

    act(() => result.current.changeDraft('Pump 1'));

    act(() => result.current.toggleDictation());
    act(() => callbacks?.onTranscript('is hot'));

    expect(result.current.dictation.isListening).toBe(true);
    expect(result.current.draft).toBe('Pump 1 is hot');
  });

  it('stops dictation when the draft is edited by hand', () => {
    let callbacks: DictationCallbacks | undefined;
    const engine: DictationEngine = {
      start: (given) => {
        callbacks = given;

        return { stop: () => given.onEnd() };
      },
    };
    const { result } = renderViewModel(engine);

    act(() => result.current.toggleDictation());

    act(() => result.current.changeDraft('typed'));
    act(() => callbacks?.onTranscript('late words'));

    expect(result.current.dictation.isListening).toBe(false);
    expect(result.current.draft).toBe('typed');
  });
});
