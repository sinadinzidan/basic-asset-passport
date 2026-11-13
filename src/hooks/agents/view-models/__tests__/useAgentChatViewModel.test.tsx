import type { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../../__mocks__/agents';
import {
  makeQueryClientWrapper,
  makeTestQueryClient,
} from '../../../../__mocks__/QueryClientWrapper';
import { ChatMessageRole } from '../../../../enums/chatMessageRole';
import { createAgentChatStore } from '../../../../store/agents';
import type { AgentContextType } from '../../../../types/agent';
import { AgentClientContext } from '../../useAgentClient';
import { AgentChatStoreContext } from '../../useAgentConversation';
import { getAgentQueryKey, UseDalilAgentContext } from '../../useDalilAgent';
import {
  UseAgentChatViewModelContext,
  type UseAgentChatViewModelContextType,
  useAgentChatViewModel,
} from '../useAgentChatViewModel';

describe(useAgentChatViewModel.name, () => {
  let chat: AgentContextType['chat'];
  let getAgent: AgentContextType['getAgent'];
  let queryClient: QueryClient;
  let context: UseAgentChatViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  let idCount: number;

  beforeEach(() => {
    idCount = 0;
    const chatStore = createAgentChatStore();

    chat = vi.fn(() => Promise.resolve({ text: 'It is fouled.', cursor: 'c1' }));
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    const agentContext = makeAgentContext({ chat, getAgent });

    queryClient = makeTestQueryClient();
    queryClient.setQueryData(
      getAgentQueryKey(agentContext.project, makeCdfAgent().externalId),
      makeCdfAgent(),
    );
    const QueryWrapper = makeQueryClientWrapper(queryClient);

    context = {
      createMessageId: () => `message-${++idCount}`,
    };
    wrapper = ({ children }) => (
      <UseAgentChatViewModelContext.Provider value={context}>
        <UseDalilAgentContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <AgentChatStoreContext.Provider value={chatStore}>
            <QueryWrapper>
              <AgentClientContext.Provider value={agentContext}>
                {children}
              </AgentClientContext.Provider>
            </QueryWrapper>
          </AgentChatStoreContext.Provider>
        </UseDalilAgentContext.Provider>
      </UseAgentChatViewModelContext.Provider>
    );
  });

  it('has no agent before the assistant is looked up, and does not look it up itself', () => {
    queryClient.clear();

    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    expect(result.current.agent).toBeNull();
    expect(getAgent).not.toHaveBeenCalled();
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
      { id: 'message-1', role: ChatMessageRole.USER, text: 'Why is pump 1 hot?' },
      { id: 'message-2', role: ChatMessageRole.AGENT, text: 'It is fouled.' },
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

  it('asks the unanswered question again without repeating it', async () => {
    // Arrange
    vi.mocked(chat).mockRejectedValueOnce(new Error('forbidden'));
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('Hi');
    });

    // Act
    await act(async () => {
      await result.current.retry();
    });

    // Assert
    expect(chat).toHaveBeenLastCalledWith({
      agentExternalId: makeCdfAgent().externalId,
      text: 'Hi',
      cursor: null,
    });
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.messages).toEqual([
      { id: 'message-1', role: ChatMessageRole.USER, text: 'Hi' },
      { id: 'message-2', role: ChatMessageRole.AGENT, text: 'It is fouled.' },
    ]);
  });

  it('asks nothing again when no question failed', async () => {
    const { result } = renderHook(() => useAgentChatViewModel(), { wrapper });

    await act(async () => {
      await result.current.send('Hi');
    });

    await act(async () => {
      await result.current.retry();
    });

    expect(chat).toHaveBeenCalledTimes(1);
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
    expect(chat).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: null }));
  });
});
