import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DictationFailure } from '../../../enums/dictationFailure';
import type { DictationCallbacks, DictationEngine, DictationSession } from '../../../types/speech';
import {
  UseSpeechDictationContext,
  type UseSpeechDictationContextType,
  useSpeechDictation,
} from '../useSpeechDictation';

describe(useSpeechDictation.name, () => {
  let callbacks: DictationCallbacks;
  let session: DictationSession;
  let engine: DictationEngine | null;
  let context: UseSpeechDictationContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    session = { stop: vi.fn() };
    engine = {
      start: vi.fn((given: DictationCallbacks) => {
        callbacks = given;
        return session;
      }),
    };
    context = { createDictationEngine: vi.fn(() => engine) };
    wrapper = ({ children }) => (
      <UseSpeechDictationContext.Provider value={context}>
        {children}
      </UseSpeechDictationContext.Provider>
    );
  });

  it('is unsupported when the browser has no speech recognition', () => {
    engine = null;

    const { result } = renderHook(() => useSpeechDictation(), { wrapper });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isListening).toBe(false);
  });

  it('does nothing when toggled without support', () => {
    engine = null;
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });

    act(() => result.current.toggle(vi.fn()));

    expect(result.current.isListening).toBe(false);
  });

  it('starts listening and passes on what is heard', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });

    act(() => result.current.toggle(onTranscript));
    act(() => callbacks.onTranscript('which pumps leak'));

    expect(result.current.isSupported).toBe(true);
    expect(result.current.isListening).toBe(true);
    expect(onTranscript).toHaveBeenCalledWith('which pumps leak');
  });

  it('stops listening when toggled again', () => {
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.toggle(vi.fn()));

    act(() => result.current.toggle(vi.fn()));

    expect(session.stop).toHaveBeenCalledTimes(1);
  });

  it('stops listening when the recognition ends by itself', () => {
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.toggle(vi.fn()));

    act(() => callbacks.onEnd());

    expect(result.current.isListening).toBe(false);
  });

  it('can start again after a session that ended while starting', () => {
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    vi.mocked(engine?.start ?? vi.fn()).mockImplementationOnce((given) => {
      given.onError(DictationFailure.FAILED);
      given.onEnd();
      return session;
    });

    act(() => result.current.toggle(vi.fn()));
    expect(result.current.isListening).toBe(false);
    expect(result.current.failure).toBe(DictationFailure.FAILED);

    act(() => result.current.toggle(vi.fn()));
    expect(result.current.isListening).toBe(true);
  });

  it('keeps the reason a session failed until the next one starts', () => {
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.toggle(vi.fn()));

    act(() => callbacks.onError(DictationFailure.BLOCKED));
    act(() => callbacks.onEnd());
    expect(result.current.failure).toBe(DictationFailure.BLOCKED);

    act(() => result.current.toggle(vi.fn()));
    expect(result.current.failure).toBeNull();
  });

  it('cancels on demand, and is quiet when nothing is listening', () => {
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.cancel());
    expect(session.stop).not.toHaveBeenCalled();

    act(() => result.current.toggle(vi.fn()));
    act(() => result.current.cancel());

    expect(session.stop).toHaveBeenCalledTimes(1);
  });

  it('drops what is recognised after it is cancelled', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.toggle(onTranscript));

    act(() => result.current.cancel());
    act(() => callbacks.onTranscript('which pumps leak'));

    expect(onTranscript).not.toHaveBeenCalled();
  });

  it('keeps what is recognised after it is toggled off', () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechDictation(), { wrapper });
    act(() => result.current.toggle(onTranscript));

    act(() => result.current.toggle(vi.fn()));
    act(() => callbacks.onTranscript('which pumps leak'));

    expect(onTranscript).toHaveBeenCalledWith('which pumps leak');
  });

  it('stops listening when the chat goes away', () => {
    const { result, unmount } = renderHook(() => useSpeechDictation(), {
      wrapper,
    });
    act(() => result.current.toggle(vi.fn()));

    unmount();

    expect(session.stop).toHaveBeenCalledTimes(1);
  });
});
