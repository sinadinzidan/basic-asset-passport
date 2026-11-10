import { createContext, useContext, useEffect, useState } from 'react';

const defaultDeps = {
  /** Calls `onTick` every `intervalMs`; returns a function that stops it. */
  startTicker: (onTick: () => void, intervalMs: number): (() => void) => {
    const id = setInterval(onTick, intervalMs);
    return () => clearInterval(id);
  },
  pickStartIndex: (count: number): number => Math.floor(Math.random() * count),
};

export type UseRotatingWordContextType = typeof defaultDeps;
export const UseRotatingWordContext =
  createContext<UseRotatingWordContextType>(defaultDeps);

/** Steps through `words` every `intervalMs`, starting from a random one. */
export function useRotatingWord(
  words: readonly string[],
  intervalMs: number,
): string {
  const { startTicker, pickStartIndex } = useContext(UseRotatingWordContext);
  const [step, setStep] = useState(() => pickStartIndex(words.length));

  useEffect(
    () => startTicker(() => setStep((current) => current + 1), intervalMs),
    [startTicker, intervalMs],
  );

  return words.length === 0 ? '' : (words[step % words.length] ?? '');
}
