import type { ComponentType, ReactNode } from 'react';

import { makeCdfAgent } from '../../../__mocks__/agents';
import { makeQueryClientWrapper, makeTestQueryClient } from '../../../__mocks__/QueryClientWrapper';
import { getAgentQueryKey } from '../../../hooks/agents/useAgent';
import { AgentChatStoreContext } from '../../../hooks/agents/useAgentChatState';
import { UseAgentChatViewModelContext } from '../../../hooks/agents/useAgentChatViewModel';
import { AgentContext } from '../../../hooks/agents/useAgentContext';
import {
  UseAgentGreetingContext,
  type UseAgentGreetingContextType,
} from '../../../hooks/agents/useAgentGreeting';
import { UseFocusedAgentContext } from '../../../hooks/agents/useFocusedAgent';
import { UseCopyToClipboardContext } from '../../../hooks/general/useCopyToClipboard';
import { UseSpeechDictationContext } from '../../../hooks/general/useSpeechDictation';
import { NavigationProvider } from '../../../providers/general/NavigationProvider';
import { createAgentChatStore } from '../../../store/agents';
import type { AgentContextType, CdfAgent } from '../../../types/agent';
import type { StateSyncApi } from '../../../types/host';
import type { DictationEngine } from '../../../types/speech';

type HarnessOptions = {
  client: AgentContextType;
  /** The agent that was already looked up; none by default, so the helper looks it up. */
  loadedAgent?: CdfAgent | null;
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
  loadedAgent = null,
  dictationEngine = null,
  copyText = () => Promise.resolve(),
  startGreetingTimeout = () => () => {},
  hostApi = null,
  hostInitialState,
}: HarnessOptions): ComponentType<{ children: ReactNode }> {
  const queryClient = makeTestQueryClient();
  if (loadedAgent !== null) {
    queryClient.setQueryData(getAgentQueryKey(client.project, loadedAgent.externalId), loadedAgent);
  }
  const QueryWrapper = makeQueryClientWrapper(queryClient);
  let idCount = 0;
  const chatStore = createAgentChatStore();
  const chatContext = {
    createMessageId: () => `message-${++idCount}`,
  };

  return function AgentWrapper({ children }) {
    return (
      <AgentContext.Provider value={client}>
        <UseFocusedAgentContext.Provider
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
        </UseFocusedAgentContext.Provider>
      </AgentContext.Provider>
    );
  };
}
