import { DictationFailure } from '../../enums/dictationFailure';
import type { DictationCallbacks, DictationEngine, DictationSession } from '../../types/speech';

type RecognitionAlternative = { transcript: string };
type RecognitionResult = {
  length: number;
  [index: number]: RecognitionAlternative | undefined;
};
type RecognitionEvent = {
  results: {
    length: number;
    [index: number]: RecognitionResult | undefined;
  };
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;

const BLOCKED_ERRORS: ReadonlySet<string> = new Set(['not-allowed', 'service-not-allowed']);

const QUIET_ERRORS: ReadonlySet<string> = new Set(['no-speech', 'aborted']);

export function createBrowserDictationEngine(
  globalObject: object,
  language: string,
): DictationEngine | null {
  const Recognition = findRecognitionConstructor(globalObject);
  if (Recognition === null) return null;

  return {
    start(callbacks: DictationCallbacks): DictationSession {
      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        callbacks.onTranscript(joinTranscript(event));
      };
      recognition.onerror = (event) => {
        const failure = toFailure(event.error);
        if (failure !== null) callbacks.onError(failure);
      };
      recognition.onend = () => callbacks.onEnd();

      try {
        recognition.start();
      } catch {
        callbacks.onError(DictationFailure.FAILED);
        callbacks.onEnd();
      }

      return { stop: () => recognition.stop() };
    },
  };
}

function findRecognitionConstructor(globalObject: object): RecognitionConstructor | null {
  const candidate: unknown =
    Reflect.get(globalObject, 'SpeechRecognition') ??
    Reflect.get(globalObject, 'webkitSpeechRecognition');

  return isRecognitionConstructor(candidate) ? candidate : null;
}

function isRecognitionConstructor(value: unknown): value is RecognitionConstructor {
  return typeof value === 'function';
}

function joinTranscript(event: RecognitionEvent): string {
  let transcript = '';
  for (let index = 0; index < event.results.length; index += 1) {
    transcript += event.results[index]?.[0]?.transcript ?? '';
  }
  return transcript;
}

function toFailure(error: string): DictationFailure | null {
  if (BLOCKED_ERRORS.has(error)) return DictationFailure.BLOCKED;
  if (QUIET_ERRORS.has(error)) return null;
  return DictationFailure.FAILED;
}
