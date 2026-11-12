import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DictationFailure } from '../../../enums/dictationFailure';
import type { DictationCallbacks } from '../../../types/speech';
import { createBrowserDictationEngine } from '../browserDictationEngine';

type FakeResult = { isFinal: boolean; text: string };

class FakeRecognition {
  static instances: FakeRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();

  constructor() {
    FakeRecognition.instances.push(this);
  }

  hear(results: FakeResult[]): void {
    this.onresult?.({
      results: Object.assign(
        results.map(({ isFinal, text }) => Object.assign([{ transcript: text }], { isFinal })),
      ),
    });
  }
}

describe(createBrowserDictationEngine.name, () => {
  let callbacks: DictationCallbacks;

  beforeEach(() => {
    FakeRecognition.instances = [];
    callbacks = { onTranscript: vi.fn(), onEnd: vi.fn(), onError: vi.fn() };
  });

  it('is not available when the browser has no speech recognition', () => {
    expect(createBrowserDictationEngine({}, 'en-GB')).toBeNull();
  });

  it('uses the prefixed constructor when that is all the browser has', () => {
    const engine = createBrowserDictationEngine(
      { webkitSpeechRecognition: FakeRecognition },
      'en-GB',
    );

    expect(engine).not.toBeNull();
  });

  it('listens continuously in the given language and shows words as they are heard', () => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'nb-NO');

    engine?.start(callbacks);

    const [recognition] = FakeRecognition.instances;
    expect(recognition?.continuous).toBe(true);
    expect(recognition?.interimResults).toBe(true);
    expect(recognition?.lang).toBe('nb-NO');
    expect(recognition?.start).toHaveBeenCalledTimes(1);
  });

  it('reports everything heard so far, final and not yet final', () => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'en-GB');
    engine?.start(callbacks);

    FakeRecognition.instances[0]?.hear([
      { isFinal: true, text: 'which pumps' },
      { isFinal: false, text: ' are leaking' },
    ]);

    expect(callbacks.onTranscript).toHaveBeenLastCalledWith('which pumps are leaking');
  });

  it('stops the recognition when the session is stopped', () => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'en-GB');
    const session = engine?.start(callbacks);

    session?.stop();

    expect(FakeRecognition.instances[0]?.stop).toHaveBeenCalledTimes(1);
  });

  it('tells when the recognition has ended', () => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'en-GB');
    engine?.start(callbacks);

    FakeRecognition.instances[0]?.onend?.();

    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
  });

  it.each(['not-allowed', 'service-not-allowed'])('reports %s as a blocked microphone', (error) => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'en-GB');
    engine?.start(callbacks);

    FakeRecognition.instances[0]?.onerror?.({ error });

    expect(callbacks.onError).toHaveBeenCalledWith(DictationFailure.BLOCKED);
  });

  it('reports other errors as a failure but not silence or an abort', () => {
    const engine = createBrowserDictationEngine({ SpeechRecognition: FakeRecognition }, 'en-GB');
    engine?.start(callbacks);
    const recognition = FakeRecognition.instances[0];

    recognition?.onerror?.({ error: 'no-speech' });
    recognition?.onerror?.({ error: 'aborted' });
    expect(callbacks.onError).not.toHaveBeenCalled();

    recognition?.onerror?.({ error: 'network' });
    expect(callbacks.onError).toHaveBeenCalledWith(DictationFailure.FAILED);
  });

  it('reports a failure and an end when the recognition cannot start', () => {
    class BrokenRecognition extends FakeRecognition {
      override start = vi.fn(() => {
        throw new Error('already started');
      });
    }
    const engine = createBrowserDictationEngine({ SpeechRecognition: BrokenRecognition }, 'en-GB');

    engine?.start(callbacks);

    expect(callbacks.onError).toHaveBeenCalledWith(DictationFailure.FAILED);
    expect(callbacks.onEnd).toHaveBeenCalledTimes(1);
  });
});
