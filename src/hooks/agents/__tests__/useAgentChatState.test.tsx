import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChatMessageRole } from '../../../enums/chatMessageRole';
import { makeCdfAgent } from '../../../mocks/agents';
import {
  agentChatStore,
  createAgentChatStore,
  EMPTY_CONVERSATION,
  getConversation,
  INITIAL_AGENT_CHAT_STATE,
} from '../../../store/agents';
import { AgentChatStoreContext, useAgentChatState } from '../useAgentChatState';

const AGENT_EXTERNAL_ID = makeCdfAgent().externalId;
const question = { id: 'm1', role: ChatMessageRole.USER, text: 'Hi' };

describe(useAgentChatState.name, () => {
  it('reads the app store when no store is supplied', () => {
    agentChatStore.setState(INITIAL_AGENT_CHAT_STATE);

    const { result } = renderHook(() =>
      useAgentChatState((store) => getConversation(store, AGENT_EXTERNAL_ID).messages),
    );

    expect(result.current).toEqual([]);
    act(() => agentChatStore.getState().addUserMessage(AGENT_EXTERNAL_ID, question));
    expect(result.current).toEqual([question]);
    agentChatStore.setState(INITIAL_AGENT_CHAT_STATE);
  });

  it('reads the store it is given instead of the app store', () => {
    const store = createAgentChatStore({
      conversations: { [AGENT_EXTERNAL_ID]: { ...EMPTY_CONVERSATION, messages: [question] } },
    });

    const { result } = renderHook(
      () => useAgentChatState((state) => getConversation(state, AGENT_EXTERNAL_ID).messages),
      {
        wrapper: ({ children }) => (
          <AgentChatStoreContext.Provider value={store}>{children}</AgentChatStoreContext.Provider>
        ),
      },
    );

    expect(result.current).toEqual([question]);
  });
});
