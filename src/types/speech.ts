/** Why dictation stopped without the user asking it to. */
export type DictationFailure = 'BLOCKED' | 'FAILED';

export type DictationCallbacks = {
  /** Everything heard so far in this session, including words not yet final. */
  onTranscript: (spoken: string) => void;
  onEnd: () => void;
  onError: (failure: DictationFailure) => void;
};

export type DictationSession = {
  stop: () => void;
};

/** Turns speech from the microphone into text. */
export type DictationEngine = {
  start: (callbacks: DictationCallbacks) => DictationSession;
};
