import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

export type TimerHandle = ReturnType<typeof setTimeout>;

export type DebounceDeps = {
  setTimer: (callback: () => void, delayMs: number) => TimerHandle;
  clearTimer: (handle: TimerHandle) => void;
};

const defaultDeps: DebounceDeps = {
  setTimer: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimer: (handle) => clearTimeout(handle),
};

export const DebounceContext = createContext<DebounceDeps>(defaultDeps);

/**
 * Calls `callback` once `delayMs` has passed since the last `run`. A newer
 * `run` replaces a pending one, `cancel` drops it, and unmounting drops it too.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const { setTimer, clearTimer } = useContext(DebounceContext);
  const timerRef = useRef<TimerHandle | undefined>(undefined);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback((): void => {
    if (timerRef.current === undefined) return;
    clearTimer(timerRef.current);
    timerRef.current = undefined;
  }, [clearTimer]);

  const run = useCallback(
    (...args: Args): void => {
      cancel();
      timerRef.current = setTimer(() => {
        timerRef.current = undefined;
        callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, setTimer, delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
