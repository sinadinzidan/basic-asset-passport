import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAgentContext } from '../../../__mocks__/agents';
import { AgentClientContext, useAgentClient } from '../useAgentClient';

describe(useAgentClient.name, () => {
  it('returns the agent context from the provider', () => {
    const agentContext = makeAgentContext();

    const { result } = renderHook(() => useAgentClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AgentClientContext.Provider value={agentContext}>{children}</AgentClientContext.Provider>
      ),
    });

    expect(result.current).toBe(agentContext);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAgentClient())).toThrow('useAgentClient must be used inside');
  });
});
