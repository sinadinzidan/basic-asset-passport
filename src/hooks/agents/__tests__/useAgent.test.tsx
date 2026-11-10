import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAgentClient, makeCdfAgent } from '../../../mocks/agents';
import { makeQueryClientWrapper } from '../../../mocks/queryClientWrapper';
import type { AgentClient } from '../../../types/agent';
import {
  UseAgentContext,
  type UseAgentContextType,
  useAgent,
} from '../useAgent';

describe(useAgent.name, () => {
  let getAgent: AgentClient['getAgent'];
  let mockContext: UseAgentContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    getAgent = vi.fn(() => Promise.resolve(makeCdfAgent()));
    mockContext = {
      useAgentClient: vi.fn(() => makeAgentClient({ getAgent })),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAgentContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseAgentContext.Provider>
    );
  });

  it('is loading until the agent arrives', async () => {
    const { result } = renderHook(() => useAgent('cooling-expert'), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('looks up only the agent asked for', async () => {
    const { result } = renderHook(() => useAgent('cooling-expert'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(makeCdfAgent()));
    expect(getAgent).toHaveBeenCalledTimes(1);
    expect(getAgent).toHaveBeenCalledWith('cooling-expert');
  });

  it('returns null when the project has no such agent', async () => {
    vi.mocked(getAgent).mockResolvedValue(null);

    const { result } = renderHook(() => useAgent('missing'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
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
