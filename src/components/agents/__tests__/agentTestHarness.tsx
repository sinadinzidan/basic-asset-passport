import type { ComponentType, ReactNode } from 'react';

import { INITIAL_AGENT_CHAT_STATE } from '../../../hooks/agents/agentChatReducer';
import { UseAgentContext } from '../../../hooks/agents/useAgent';
import { UseAgentChatViewModelContext } from '../../../hooks/agents/useAgentChatViewModel';
import { UseAgentPickerViewModelContext } from '../../../hooks/agents/useAgentPickerViewModel';
import { UseCopyToClipboardContext } from '../../../hooks/agents/useCopyToClipboard';
import { UseSpeechDictationContext } from '../../../hooks/agents/useSpeechDictation';
import { makeCdfAgent } from '../../../mocks/agents';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AgentClient, CdfAgent } from '../../../types/agent';
import type { DictationEngine } from '../../../types/speech';
import { AgentChatStateProvider } from '../AgentChatStateProvider';

type HarnessOptions = {
  client: AgentClient;
  selectedAgent?: CdfAgent | null;
  /** The speech engine; none by default, so the browser has no dictation. */
  dictationEngine?: DictationEngine | null;
  /** What copying does; by default it succeeds and the confirmation never goes away. */
  copyText?: (text: string) => Promise<void>;
};

/** Wraps agent components with a fake agent client and the shared chat state. */
export function makeAgentWrapper({
  client,
  selectedAgent = null,
  dictationEngine = null,
  copyText = () => Promise.resolve(),
}: HarnessOptions): ComponentType<{ children: ReactNode }> {
  const QueryWrapper = makeQueryClientWrapper();
  let idCount = 0;
  const chatContext = {
    useAgentClient: () => client,
    createMessageId: () => `message-${++idCount}`,
  };

  return function AgentWrapper({ children }) {
    return (
      <UseAgentContext.Provider value={{ useAgentClient: () => client }}>
        <UseAgentPickerViewModelContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <UseAgentChatViewModelContext.Provider value={chatContext}>
            <AgentChatStateProvider
              initialState={{ ...INITIAL_AGENT_CHAT_STATE, selectedAgent }}
            >
              <UseSpeechDictationContext.Provider
                value={{ createDictationEngine: () => dictationEngine }}
              >
                <UseCopyToClipboardContext.Provider
                  value={{ writeText: copyText, startTimeout: () => () => {} }}
                >
                  <QueryWrapper>{children}</QueryWrapper>
                </UseCopyToClipboardContext.Provider>
              </UseSpeechDictationContext.Provider>
            </AgentChatStateProvider>
          </UseAgentChatViewModelContext.Provider>
        </UseAgentPickerViewModelContext.Provider>
      </UseAgentContext.Provider>
    );
  };
}
