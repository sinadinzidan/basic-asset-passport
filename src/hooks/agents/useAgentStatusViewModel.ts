import { createContext, useCallback, useContext, useEffect } from 'react';

import { FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';
import { getErrorReason } from '../../lib/errorReason';

import { useAgent } from './useAgent';
import { useAgentChatState } from './useAgentChatState';

const defaultDeps = { focusedAgentExternalId: FOCUSED_AGENT_EXTERNAL_ID };

export type UseAgentStatusViewModelContextType = typeof defaultDeps;
export const UseAgentStatusViewModelContext =
  createContext<UseAgentStatusViewModelContextType>(defaultDeps);

export type AgentStatusViewModel = {
  isLoading: boolean;
  isError: boolean;

  errorReason: string | null;
  isRetrying: boolean;
  isMissing: boolean;
  retry: () => void;
};

export function useAgentStatusViewModel(): AgentStatusViewModel {
  const { focusedAgentExternalId } = useContext(UseAgentStatusViewModelContext);
  const { data, error, isPending, isError, isFetching, refetch } = useAgent(focusedAgentExternalId);
  const selectAgent = useAgentChatState((store) => store.selectAgent);

  const focusedAgent = data ?? null;

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (focusedAgent !== null) {
      selectAgent(focusedAgent);
    }
  }, [selectAgent, focusedAgent]);

  return {
    isLoading: isPending,
    isError,
    errorReason: getErrorReason(error),
    isRetrying: isFetching,
    isMissing: data === null,
    retry,
  };
}
