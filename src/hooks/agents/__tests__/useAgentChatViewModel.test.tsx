import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentChatStateProvider } from '../../../components/agents/AgentChatStateProvider';
import { makeAgentClient, makeCdfAgent } from '../../../mocks/agents';
import type { AgentClient } from '../../../types/agent';
import { INITIAL_AGENT_CHAT_STATE } from '../agentChatReducer';
import {
  UseAgentChatViewModelContext,
  type UseAgentChatViewModelContextType,
  useAgentChatViewModel,
} from '../useAgentChatViewModel';

describe(useAgentChatViewModel.name, () => {
  let chat: AgentClient['chat'];
  let context: UseAgentChatViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let idCount: number;

  beforeEach(() => {
    idCount = 0;
    chat = vi.fn(() =>
      Promise.resolve({ text: 'It is fouled.', cursor: 'c1' }),
    );
    context = {
      useAgentClient: vi.fn(() => makeAgentClient({ chat })),
      createMessageId: () => `message-${++idCount}`,
    };
    wrapper = ({ children }) => (
      <UseAgentChatViewModelContext.Provider value={context}>
        <AgentChatStateProvider
          initialState={{
            ...INITIAL_AGENT_CHAT_STATE,
            selectedAgent: makeCdfAgent(),
          }}
        >
          {children}
        </AgentChatStateProvider>
      </UseAgentChatViewModelContext.Provider>
    );
  });

  it('chats with the chosen agent and starts with no messages', () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    expect(result.current.agent).toEqual(makeCdfAgent());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isSending).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('shows the question at once and the reply when it arrives', async () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('  Why is pump 1 hot?  ');
    });

    expect(result.current.messages).toEqual([
      { id: 'message-1', role: 'USER', text: 'Why is pump 1 hot?' },
      { id: 'message-2', role: 'AGENT', text: 'It is fouled.' },
    ]);
    expect(result.current.isSending).toBe(false);
  });

  it('is waiting while the agent has not replied', async () => {
    vi.mocked(chat).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    act(() => {
      void result.current.send('Hi');
    });

    await waitFor(() => expect(result.current.isSending).toBe(true));
    expect(result.current.messages).toHaveLength(1);
  });

  it('asks the agent by its external ID, continuing with the last cursor', async () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('First');
    });
    await act(async () => {
      await result.current.send('Second');
    });

    expect(chat).toHaveBeenNthCalledWith(1, {
      agentExternalId: 'cooling-expert',
      text: 'First',
      cursor: null,
    });
    expect(chat).toHaveBeenNthCalledWith(2, {
      agentExternalId: 'cooling-expert',
      text: 'Second',
      cursor: 'c1',
    });
  });

  it('keeps the question and says why when the agent cannot answer', async () => {
    vi.mocked(chat).mockRejectedValue(new Error('forbidden'));
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('Hi');
    });

    expect(result.current.errorMessage).toBe('forbidden');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.isSending).toBe(false);
  });

  it('ignores an empty question', async () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('   ');
    });

    expect(chat).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual([]);
  });

  it('ignores a second question while waiting for the reply', async () => {
    vi.mocked(chat).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });
    act(() => {
      void result.current.send('First');
    });
    await waitFor(() => expect(result.current.isSending).toBe(true));

    await act(async () => {
      await result.current.send('Second');
    });

    expect(chat).toHaveBeenCalledTimes(1);
  });

  it('starts a new chat', async () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });
    await act(async () => {
      await result.current.send('Hi');
    });

    act(() => result.current.startNewChat());

    expect(result.current.messages).toEqual([]);
    await act(async () => {
      await result.current.send('Again');
    });
    expect(chat).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: null }),
    );
  });
});
