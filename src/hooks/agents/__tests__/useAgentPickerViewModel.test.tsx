import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentChatStateProvider } from '../../../components/agents/AgentChatStateProvider';
import { makeAgentClient, makeCdfAgent } from '../../../mocks/agents';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AgentClient } from '../../../types/agent';
import { UseAgentContext, type UseAgentContextType } from '../useAgent';
import { useAgentChatState } from '../useAgentChatState';
import {
  UseAgentPickerViewModelContext,
  useAgentPickerViewModel,
} from '../useAgentPickerViewModel';

describe(useAgentPickerViewModel.name, () => {
  let getAgent: AgentClient['getAgent'];
  let agentsContext: UseAgentContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    agentsContext = {
      useAgentClient: vi.fn(() => makeAgentClient({ getAgent })),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAgentContext.Provider value={agentsContext}>
        <UseAgentPickerViewModelContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <AgentChatStateProvider>
            <QueryWrapper>{children}</QueryWrapper>
          </AgentChatStateProvider>
        </UseAgentPickerViewModelContext.Provider>
      </UseAgentContext.Provider>
    );
  });

  it('is loading until the agent arrives', async () => {
    const { result } = renderHook(() => useAgentPickerViewModel(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isMissing).toBe(false);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('looks up and selects only the focused agent', async () => {
    const { result } = renderHook(
      () => ({
        picker: useAgentPickerViewModel(),
        chat: useAgentChatState(),
      }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.chat.state.selectedAgent).toEqual(makeCdfAgent()),
    );
    expect(getAgent).toHaveBeenCalledWith(makeCdfAgent().externalId);
    expect(result.current.picker.isMissing).toBe(false);
  });

  it('reports the agent as missing when the project does not have it', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    const { result } = renderHook(
      () => ({
        picker: useAgentPickerViewModel(),
        chat: useAgentChatState(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.picker.isMissing).toBe(true));
    expect(result.current.chat.state.selectedAgent).toBeNull();
  });

  it('reports an error when the agent cannot be looked up', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAgentPickerViewModel(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isMissing).toBe(false);
  });

  it('looks the agent up again on retry', async () => {
    vi.mocked(getAgent).mockRejectedValueOnce(new Error('no access'));
    const { result } = renderHook(
      () => ({
        picker: useAgentPickerViewModel(),
        chat: useAgentChatState(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.picker.isError).toBe(true));

    act(() => result.current.picker.retry());

    await waitFor(() =>
      expect(result.current.chat.state.selectedAgent).toEqual(makeCdfAgent()),
    );
  });
});
