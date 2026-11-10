import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createBrowserDictationEngine } from '../../services/speech/browserDictationEngine';
import type {
  DictationEngine,
  DictationFailure,
  DictationSession,
} from '../../types/speech';

const defaultDeps = {
  createDictationEngine: (): DictationEngine | null =>
    createBrowserDictationEngine(window, navigator.language),
};

export type UseSpeechDictationContextType = typeof defaultDeps;
export const UseSpeechDictationContext =
  createContext<UseSpeechDictationContextType>(defaultDeps);

export type SpeechDictation = {
  isSupported: boolean;
  isListening: boolean;
  failure: DictationFailure | null;
  /** Starts listening, or stops when already listening. */
  toggle: (onTranscript: (spoken: string) => void) => void;
  stop: () => void;
};

/** Speech to text from the microphone, for filling in a text field. */
export function useSpeechDictation(): SpeechDictation {
  const { createDictationEngine } = useContext(UseSpeechDictationContext);
  const engine = useMemo(
    () => createDictationEngine(),
    [createDictationEngine],
  );
  const sessionRef = useRef<DictationSession | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [failure, setFailure] = useState<DictationFailure | null>(null);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
  }, []);

  const toggle = useCallback(
    (onTranscript: (spoken: string) => void) => {
      if (engine === null) return;
      if (sessionRef.current !== null) {
        sessionRef.current.stop();
        return;
      }

      setFailure(null);
      setIsListening(true);
      // An engine that cannot start ends before `start` returns.
      let hasEnded = false;
      const session = engine.start({
        onTranscript,
        onError: setFailure,
        onEnd: () => {
          hasEnded = true;
          sessionRef.current = null;
          setIsListening(false);
        },
      });
      sessionRef.current = hasEnded ? null : session;
    },
    [engine],
  );

  useEffect(() => () => sessionRef.current?.stop(), []);

  return { isSupported: engine !== null, isListening, failure, toggle, stop };
}
