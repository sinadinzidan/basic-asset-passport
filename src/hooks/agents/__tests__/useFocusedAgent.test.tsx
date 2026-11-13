import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../__mocks__/agents';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import { FOCUSED_AGENT_EXTERNAL_ID } from '../../../constants/agents';
import type { AgentContextType } from '../../../types/agent';
import { AgentContext } from '../useAgentContext';
import { UseFocusedAgentContext, useFocusedAgent } from '../useFocusedAgent';

describe(useFocusedAgent.name, () => {
  let getAgent: AgentContextType['getAgent'];
  let QueryWrapper: ComponentType<{ children: ReactNode }>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    const agentContext = makeAgentContext({ getAgent });

    QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <AgentContext.Provider value={agentContext}>
        <UseFocusedAgentContext.Provider
          value={{ focusedAgentExternalId: makeCdfAgent().externalId }}
        >
          <QueryWrapper>{children}</QueryWrapper>
        </UseFocusedAgentContext.Provider>
      </AgentContext.Provider>
    );
  });

  it('looks up the agent the app is focused on', async () => {
    const { result } = renderHook(() => useFocusedAgent(true), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(makeCdfAgent()));
    expect(getAgent).toHaveBeenCalledExactlyOnceWith(makeCdfAgent().externalId);
  });

  it('looks up the configured agent when no other is supplied', async () => {
    const { result } = renderHook(() => useFocusedAgent(true), {
      wrapper: ({ children }) => (
        <AgentContext.Provider value={makeAgentContext({ getAgent })}>
          <QueryWrapper>{children}</QueryWrapper>
        </AgentContext.Provider>
      ),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(getAgent).toHaveBeenCalledWith(FOCUSED_AGENT_EXTERNAL_ID);
  });

  it('does not look the agent up when it only follows the lookup', () => {
    const { result } = renderHook(() => useFocusedAgent(false), { wrapper });

    expect(result.current.data).toBeUndefined();
    expect(getAgent).not.toHaveBeenCalled();
  });

  it('receives the agent that another reader looked up', async () => {
    const { result } = renderHook(
      () => ({ follower: useFocusedAgent(false), reader: useFocusedAgent(true) }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.follower.data).toEqual(makeCdfAgent()));
    expect(getAgent).toHaveBeenCalledTimes(1);
  });

  it('is loading until the agent arrives', async () => {
    const { result } = renderHook(() => useFocusedAgent(true), { wrapper });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('returns null when the project has no such agent', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    const { result } = renderHook(() => useFocusedAgent(true), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('reports a failure to look the agent up', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useFocusedAgent(true), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('no access');
  });
});
