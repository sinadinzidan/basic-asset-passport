import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { COPY_CONFIRMATION_MS } from '../../constants/agents';

const defaultDeps = {
  writeText: async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
  },
  /** Calls `onDone` after `delayMs`; returns a function that cancels it. */
  startTimeout: (onDone: () => void, delayMs: number): (() => void) => {
    const id = setTimeout(onDone, delayMs);
    return () => clearTimeout(id);
  },
};

export type UseCopyToClipboardContextType = typeof defaultDeps;
export const UseCopyToClipboardContext =
  createContext<UseCopyToClipboardContextType>(defaultDeps);

export type CopyStatus = 'IDLE' | 'COPIED' | 'FAILED';

export type CopyToClipboard = {
  status: CopyStatus;
  copy: (text: string) => Promise<void>;
};

/** Copies text to the clipboard and reports the result for a moment. */
export function useCopyToClipboard(): CopyToClipboard {
  const { writeText, startTimeout } = useContext(UseCopyToClipboardContext);
  const [status, setStatus] = useState<CopyStatus>('IDLE');
  const cancelResetRef = useRef<(() => void) | null>(null);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      let result: CopyStatus = 'COPIED';
      try {
        await writeText(text);
      } catch {
        result = 'FAILED';
      }

      cancelResetRef.current?.();
      setStatus(result);
      cancelResetRef.current = startTimeout(
        () => setStatus('IDLE'),
        COPY_CONFIRMATION_MS,
      );
    },
    [writeText, startTimeout],
  );

  useEffect(() => () => cancelResetRef.current?.(), []);

  return { status, copy };
}
