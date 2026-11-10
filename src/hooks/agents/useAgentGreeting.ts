import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  GREETING_INTRO_DELAY_MS,
  GREETING_INTRO_DURATION_MS,
} from '../../constants/agents';

const defaultDeps = {
  /** Calls `onDone` after `delayMs`; returns a function that cancels it. */
  startTimeout: (onDone: () => void, delayMs: number): (() => void) => {
    const id = setTimeout(onDone, delayMs);
    return () => clearTimeout(id);
  },
};

export type UseAgentGreetingContextType = typeof defaultDeps;
export const UseAgentGreetingContext =
  createContext<UseAgentGreetingContextType>(defaultDeps);

type IntroPhase = 'WAITING' | 'SHOWN' | 'DONE';

export type AgentGreeting = {
  /** True while the mascot greets by itself, once, shortly after the app opens. */
  isIntroShown: boolean;
  /** Ends that greeting for good, also when it has not started yet. */
  dismissIntro: () => void;
};

/** Times the greeting the mascot gives by itself when the app opens. */
export function useAgentGreeting(): AgentGreeting {
  const { startTimeout } = useContext(UseAgentGreetingContext);

  const [introPhase, setIntroPhase] = useState<IntroPhase>('WAITING');

  const dismissIntro = useCallback((): void => setIntroPhase('DONE'), []);

  useEffect(() => {
    if (introPhase === 'WAITING') {
      return startTimeout(
        () => setIntroPhase('SHOWN'),
        GREETING_INTRO_DELAY_MS,
      );
    }
    if (introPhase === 'SHOWN') {
      return startTimeout(
        () => setIntroPhase('DONE'),
        GREETING_INTRO_DURATION_MS,
      );
    }
    return undefined;
  }, [introPhase, startTimeout]);

  return { isIntroShown: introPhase === 'SHOWN', dismissIntro };
}
