import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../mocks/agents';
import { makeQueryClientWrapper } from '../../../mocks/QueryClientWrapper';
import { createAgentChatStore } from '../../../store/agents';
import type { AgentContextType } from '../../../types/agent';
import { AgentChatStoreContext, useAgentChatState } from '../useAgentChatState';
import { AgentContext } from '../useAgentContext';
import {
  UseAgentStatusViewModelContext,
  useAgentStatusViewModel,
} from '../useAgentStatusViewModel';

describe(useAgentStatusViewModel.name, () => {
  let getAgent: AgentContextType['getAgent'];
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    const agentContext = makeAgentContext({ getAgent });
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <AgentContext.Provider value={agentContext}>
        <UseAgentStatusViewModelContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <AgentChatStoreContext.Provider value={createAgentChatStore()}>
            <QueryWrapper>{children}</QueryWrapper>
          </AgentChatStoreContext.Provider>
        </UseAgentStatusViewModelContext.Provider>
      </AgentContext.Provider>
    );
  });

  it('is loading until the agent arrives', async () => {
    const { result } = renderHook(() => useAgentStatusViewModel(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isMissing).toBe(false);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('looks up and selects only the focused agent', async () => {
    const { result } = renderHook(
      () => ({
        picker: useAgentStatusViewModel(),
        selectedAgent: useAgentChatState((store) => store.selectedAgent),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.selectedAgent).toEqual(makeCdfAgent()));
    expect(getAgent).toHaveBeenCalledWith(makeCdfAgent().externalId);
    expect(result.current.picker.isMissing).toBe(false);
  });

  it('reports the agent as missing when the project does not have it', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    const { result } = renderHook(
      () => ({
        picker: useAgentStatusViewModel(),
        selectedAgent: useAgentChatState((store) => store.selectedAgent),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.picker.isMissing).toBe(true));
    expect(result.current.selectedAgent).toBeNull();
  });

  it('reports an error when the agent cannot be looked up', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAgentStatusViewModel(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isMissing).toBe(false);
  });

  it('gives the reason the lookup failed', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAgentStatusViewModel(), { wrapper });

    await waitFor(() => expect(result.current.errorReason).toBe('no access'));
  });

  it('has no reason when the lookup did not fail', async () => {
    const { result } = renderHook(() => useAgentStatusViewModel(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.errorReason).toBeNull();
  });

  it('looks the agent up again on retry', async () => {
    vi.mocked(getAgent).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderHook(
      () => ({
        picker: useAgentStatusViewModel(),
        selectedAgent: useAgentChatState((store) => store.selectedAgent),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.picker.isError).toBe(true));

    act(() => result.current.picker.retry());

    await waitFor(() => expect(result.current.selectedAgent).toEqual(makeCdfAgent()));
  });
});
