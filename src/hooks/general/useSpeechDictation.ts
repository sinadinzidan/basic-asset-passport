import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { DictationFailure } from '../../enums/dictationFailure';
import { createBrowserDictationEngine } from '../../services/speech/browserDictationEngine';
import type { DictationEngine, DictationSession } from '../../types/speech';

const defaultDeps = {
  createDictationEngine: (): DictationEngine | null =>
    createBrowserDictationEngine(window, navigator.language),
};

export type UseSpeechDictationContextType = typeof defaultDeps;
export const UseSpeechDictationContext = createContext<UseSpeechDictationContextType>(defaultDeps);

export type SpeechDictation = {
  isSupported: boolean;
  isListening: boolean;
  failure: DictationFailure | null;

  toggle: (onTranscript: (spoken: string) => void) => void;

  cancel: () => void;
};

export function useSpeechDictation(): SpeechDictation {
  const { createDictationEngine } = useContext(UseSpeechDictationContext);

  const [isListening, setIsListening] = useState(false);
  const [failure, setFailure] = useState<DictationFailure | null>(null);
  const sessionReference = useRef<DictationSession | null>(null);
  const onTranscriptReference = useRef<((spoken: string) => void) | null>(null);

  const engine = useMemo(() => createDictationEngine(), [createDictationEngine]);

  const cancel = useCallback(() => {
    onTranscriptReference.current = null;
    sessionReference.current?.stop();
  }, []);
  const toggle = useCallback(
    (onTranscript: (spoken: string) => void) => {
      if (engine === null) return;
      if (sessionReference.current !== null) {
        sessionReference.current.stop();
        return;
      }

      setFailure(null);
      setIsListening(true);
      onTranscriptReference.current = onTranscript;

      let hasEnded = false;
      const session = engine.start({
        onTranscript: (spoken) => onTranscriptReference.current?.(spoken),
        onError: setFailure,
        onEnd: () => {
          hasEnded = true;
          sessionReference.current = null;
          setIsListening(false);
        },
      });
      sessionReference.current = hasEnded ? null : session;
    },
    [engine],
  );

  useEffect(() => () => sessionReference.current?.stop(), []);

  return { isSupported: engine !== null, isListening, failure, toggle, cancel };
}
