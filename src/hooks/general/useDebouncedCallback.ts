import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

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

export function useDebouncedCallback<CallbackArguments extends unknown[]>(
  callback: (...callbackArguments: CallbackArguments) => void,
  delayMs: number,
) {
  const { setTimer, clearTimer } = useContext(DebounceContext);

  const timerReference = useRef<TimerHandle | undefined>(undefined);
  const callbackReference = useRef(callback);

  const cancel = useCallback((): void => {
    if (timerReference.current === undefined) return;
    clearTimer(timerReference.current);
    timerReference.current = undefined;
  }, [clearTimer]);

  const run = useCallback(
    (...callbackArguments: CallbackArguments): void => {
      cancel();
      timerReference.current = setTimer(() => {
        timerReference.current = undefined;
        callbackReference.current(...callbackArguments);
      }, delayMs);
    },
    [cancel, setTimer, delayMs],
  );

  useEffect(() => {
    callbackReference.current = callback;
  }, [callback]);
  useEffect(() => cancel, [cancel]);

  return { run, cancel };
}
