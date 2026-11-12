import { getErrorReason } from '../../lib/errorReason';

import { useFocusedAgent } from './useFocusedAgent';

type AgentStatusViewModel = {
  isLoading: boolean;
  isError: boolean;
  errorReason: string | null;
  isRetrying: boolean;
  isMissing: boolean;
  retry: () => void;
};

export function useAgentStatusViewModel(): AgentStatusViewModel {
  const { data, error, isPending, isError, isFetching, refetch } = useFocusedAgent(true);

  function retry(): void {
    void refetch();
  }

  return {
    isLoading: isPending,
    isError,
    errorReason: getErrorReason(error),
    isRetrying: isFetching,
    isMissing: data === null,
    retry,
  };
}
