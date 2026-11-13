import { getErrorReason } from '../../../lib/errorReason';
import { useDalilAgent } from '../useDalilAgent';

type AgentStatusViewModel = {
  isLoading: boolean;
  isError: boolean;
  errorReason: string | null;
  isRetrying: boolean;
  isMissing: boolean;
  retry: () => void;
};

export function useAgentStatusViewModel(): AgentStatusViewModel {
  const { data, error, isPending, isError, isFetching, retry } = useDalilAgent(true);

  return {
    isLoading: isPending,
    isError,
    errorReason: getErrorReason(error),
    isRetrying: isFetching,
    isMissing: data === null,
    retry,
  };
}
