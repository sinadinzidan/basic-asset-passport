import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { GREETING_INTRO_DELAY_MS, GREETING_INTRO_DURATION_MS } from '../../constants/agents';
import { IntroPhase } from '../../enums/introPhase';
import { startTimeout } from '../../lib/startTimeout';

const defaultDeps = { startTimeout };

export type UseAgentGreetingContextType = typeof defaultDeps;
export const UseAgentGreetingContext = createContext<UseAgentGreetingContextType>(defaultDeps);

export type AgentGreeting = {
  isIntroShown: boolean;

  dismissIntro: () => void;
};

export function useAgentGreeting(): AgentGreeting {
  const { startTimeout: startTimer } = useContext(UseAgentGreetingContext);

  const [introPhase, setIntroPhase] = useState<IntroPhase>(IntroPhase.WAITING);

  const dismissIntro = useCallback((): void => setIntroPhase(IntroPhase.DONE), []);

  useEffect(() => {
    if (introPhase === IntroPhase.WAITING) {
      return startTimer(() => setIntroPhase(IntroPhase.SHOWN), GREETING_INTRO_DELAY_MS);
    }
    if (introPhase === IntroPhase.SHOWN) {
      return startTimer(() => setIntroPhase(IntroPhase.DONE), GREETING_INTRO_DURATION_MS);
    }
    return undefined;
  }, [introPhase, startTimer]);

  return { isIntroShown: introPhase === IntroPhase.SHOWN, dismissIntro };
}
