import type { ComponentType, ReactNode } from 'react';

import { AgentChatStoreContext } from '../../../hooks/agents/useAgentChatState';
import { UseAgentChatViewModelContext } from '../../../hooks/agents/useAgentChatViewModel';
import { AgentContext } from '../../../hooks/agents/useAgentContext';
import {
  UseAgentGreetingContext,
  type UseAgentGreetingContextType,
} from '../../../hooks/agents/useAgentGreeting';
import { UseAgentStatusViewModelContext } from '../../../hooks/agents/useAgentStatusViewModel';
import { UseCopyToClipboardContext } from '../../../hooks/general/useCopyToClipboard';
import { UseSpeechDictationContext } from '../../../hooks/general/useSpeechDictation';
import { makeCdfAgent } from '../../../mocks/agents';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import { NavigationProvider } from '../../../providers/general/NavigationProvider';
import { createAgentChatStore, INITIAL_AGENT_CHAT_STATE } from '../../../store/agents';
import type { AgentContextType, CdfAgent } from '../../../types/agent';
import type { StateSyncApi } from '../../../types/host';
import type { DictationEngine } from '../../../types/speech';

type HarnessOptions = {
  client: AgentContextType;
  selectedAgent?: CdfAgent | null;
  /** The speech engine; none by default, so the browser has no dictation. */
  dictationEngine?: DictationEngine | null;
  /** What copying does; by default it succeeds and the confirmation never goes away. */
  copyText?: (text: string) => Promise<void>;
  /** The waits of the mascot's greeting; by default they never end, so it never greets by itself. */
  startGreetingTimeout?: UseAgentGreetingContextType['startTimeout'];
  /** Where the screen the reader is on is synced; none by default, as in mock mode. */
  hostApi?: StateSyncApi | null;
  /** The screen the host restored from the URL, as JSON. */
  hostInitialState?: string;
};

/** Wraps agent components with a fake agent client and the shared chat state. */
export function makeAgentWrapper({
  client,
  selectedAgent = null,
  dictationEngine = null,
  copyText = () => Promise.resolve(),
  startGreetingTimeout = () => () => {},
  hostApi = null,
  hostInitialState,
}: HarnessOptions): ComponentType<{ children: ReactNode }> {
  const QueryWrapper = makeQueryClientWrapper();
  let idCount = 0;
  const chatStore = createAgentChatStore({ ...INITIAL_AGENT_CHAT_STATE, selectedAgent });
  const chatContext = {
    createMessageId: () => `message-${++idCount}`,
  };

  return function AgentWrapper({ children }) {
    return (
      <AgentContext.Provider value={client}>
        <UseAgentStatusViewModelContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <UseAgentChatViewModelContext.Provider value={chatContext}>
            <AgentChatStoreContext.Provider value={chatStore}>
              <UseSpeechDictationContext.Provider
                value={{ createDictationEngine: () => dictationEngine }}
              >
                <UseCopyToClipboardContext.Provider
                  value={{ writeText: copyText, startTimeout: () => () => {} }}
                >
                  <UseAgentGreetingContext.Provider value={{ startTimeout: startGreetingTimeout }}>
                    <QueryWrapper>
                      <NavigationProvider api={hostApi} initialState={hostInitialState}>
                        {children}
                      </NavigationProvider>
                    </QueryWrapper>
                  </UseAgentGreetingContext.Provider>
                </UseCopyToClipboardContext.Provider>
              </UseSpeechDictationContext.Provider>
            </AgentChatStoreContext.Provider>
          </UseAgentChatViewModelContext.Provider>
        </UseAgentStatusViewModelContext.Provider>
      </AgentContext.Provider>
    );
  };
}
