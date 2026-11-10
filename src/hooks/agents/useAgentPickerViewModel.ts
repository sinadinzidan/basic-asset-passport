import { createContext, useCallback, useContext, useEffect } from 'react';

import { FOCUSED_AGENT_EXTERNAL_ID } from '../../constants/agents';

import { useAgent } from './useAgent';
import { useAgentChatState } from './useAgentChatState';

const defaultDeps = { focusedAgentExternalId: FOCUSED_AGENT_EXTERNAL_ID };

export type UseAgentPickerViewModelContextType = typeof defaultDeps;
export const UseAgentPickerViewModelContext =
  createContext<UseAgentPickerViewModelContextType>(defaultDeps);

export type AgentPickerViewModel = {
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  isMissing: boolean;
  retry: () => void;
};

/**
 * Looks up the one agent the helper talks to and selects it, which opens its
 * chat. Only when that fails does the panel show why.
 */
export function useAgentPickerViewModel(): AgentPickerViewModel {
  const { focusedAgentExternalId } = useContext(UseAgentPickerViewModelContext);
  const { data, isPending, isError, isFetching, refetch } = useAgent(
    focusedAgentExternalId,
  );
  const { dispatch } = useAgentChatState();

  const focusedAgent = data ?? null;

  useEffect(() => {
    if (focusedAgent !== null) {
      dispatch({ type: 'AGENT_SELECTED', agent: focusedAgent });
    }
  }, [dispatch, focusedAgent]);

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    isLoading: isPending,
    isError,
    isRetrying: isFetching,
    isMissing: data === null,
    retry,
  };
}
