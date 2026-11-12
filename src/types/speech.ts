import type { DictationFailure } from '../enums/dictationFailure';

export type DictationCallbacks = {
  onTranscript: (spoken: string) => void;
  onEnd: () => void;
  onError: (failure: DictationFailure) => void;
};

export type DictationSession = {
  stop: () => void;
};

export type DictationEngine = {
  start: (callbacks: DictationCallbacks) => DictationSession;
};
