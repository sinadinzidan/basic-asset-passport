import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeCdfAgent } from '../../../mocks/agents';
import {
  agentChatStore,
  createAgentChatStore,
  INITIAL_AGENT_CHAT_STATE,
} from '../../../store/agents';
import { AgentChatStoreContext, useAgentChatState } from '../useAgentChatState';

describe(useAgentChatState.name, () => {
  it('reads the app store when no store is supplied', () => {
    agentChatStore.setState(INITIAL_AGENT_CHAT_STATE);

    const { result } = renderHook(() => useAgentChatState((store) => store.selectedAgent));

    expect(result.current).toBeNull();
    act(() => agentChatStore.getState().selectAgent(makeCdfAgent()));
    expect(result.current).toEqual(makeCdfAgent());
    agentChatStore.setState(INITIAL_AGENT_CHAT_STATE);
  });

  it('reads the store it is given instead of the app store', () => {
    const store = createAgentChatStore({
      ...INITIAL_AGENT_CHAT_STATE,
      selectedAgent: makeCdfAgent(),
    });

    const { result } = renderHook(() => useAgentChatState((state) => state.selectedAgent), {
      wrapper: ({ children }) => (
        <AgentChatStoreContext.Provider value={store}>{children}</AgentChatStoreContext.Provider>
      ),
    });

    expect(result.current).toEqual(makeCdfAgent());
  });
});
