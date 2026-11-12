import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { makeAgentContext } from '../../../mocks/agents';
import { AgentContext, useAgentContext } from '../useAgentContext';

describe(useAgentContext.name, () => {
  it('returns the agent context from the provider', () => {
    const agentContext = makeAgentContext();

    const { result } = renderHook(() => useAgentContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AgentContext.Provider value={agentContext}>{children}</AgentContext.Provider>
      ),
    });

    expect(result.current).toBe(agentContext);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useAgentContext())).toThrow(
      'useAgentContext must be used inside',
    );
  });
});
