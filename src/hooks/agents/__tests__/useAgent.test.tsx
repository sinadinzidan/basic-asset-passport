import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentContext, makeCdfAgent } from '../../../__mocks__/agents';
import { makeQueryClientWrapper } from '../../../__mocks__/QueryClientWrapper';
import type { AgentContextType } from '../../../types/agent';
import { useAgent } from '../useAgent';
import { AgentContext } from '../useAgentContext';

describe(useAgent.name, () => {
  let getAgent: AgentContextType['getAgent'];
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    const agentContext = makeAgentContext({ getAgent });
    const QueryWrapper = makeQueryClientWrapper();

    wrapper = ({ children }) => (
      <AgentContext.Provider value={agentContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </AgentContext.Provider>
    );
  });

  it('is loading until the agent arrives', async () => {
    const { result } = renderHook(() => useAgent('cooling-expert'), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('looks up only the agent asked for', async () => {
    const { result } = renderHook(() => useAgent('cooling-expert'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(makeCdfAgent()));
    expect(getAgent).toHaveBeenCalledTimes(1);
    expect(getAgent).toHaveBeenCalledWith('cooling-expert');
  });

  it('looks nothing up when told not to', () => {
    const { result } = renderHook(() => useAgent('cooling-expert', false), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(getAgent).not.toHaveBeenCalled();
  });

  it('returns null when the project has no such agent', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    const { result } = renderHook(() => useAgent('missing'), { wrapper });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('reports a failure to look the agent up', async () => {
    vi.mocked(getAgent).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAgent('cooling-expert'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('no access');
  });
});
