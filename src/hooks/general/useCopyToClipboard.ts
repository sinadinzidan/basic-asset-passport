import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { COPY_CONFIRMATION_MS } from '../../constants/clipboard';
import { CopyStatus } from '../../enums/copyStatus';
import { startTimeout } from '../../lib/startTimeout';

const defaultDeps = {
  writeText: async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
  },
  startTimeout,
};

export type UseCopyToClipboardContextType = typeof defaultDeps;
export const UseCopyToClipboardContext = createContext<UseCopyToClipboardContextType>(defaultDeps);

export type CopyToClipboard = {
  status: CopyStatus;
  copy: (text: string) => Promise<void>;
};

export function useCopyToClipboard(): CopyToClipboard {
  const { writeText, startTimeout: startTimer } = useContext(UseCopyToClipboardContext);

  const [status, setStatus] = useState<CopyStatus>(CopyStatus.IDLE);
  const cancelResetReference = useRef<(() => void) | null>(null);

  const copy = useCallback(
    async (text: string): Promise<void> => {
      let result: CopyStatus = CopyStatus.COPIED;
      try {
        await writeText(text);
      } catch {
        result = CopyStatus.FAILED;
      }

      cancelResetReference.current?.();
      setStatus(result);
      cancelResetReference.current = startTimer(
        () => setStatus(CopyStatus.IDLE),
        COPY_CONFIRMATION_MS,
      );
    },
    [writeText, startTimer],
  );

  useEffect(() => () => cancelResetReference.current?.(), []);

  return { status, copy };
}
