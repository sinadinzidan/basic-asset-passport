import type { UseQueryResult } from '@tanstack/react-query';

export type QueryState<Data> = {
  data: Data | undefined;
  error: Error | null;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  isLoadingMore: boolean;
  retry: () => void;
};

export function toQueryState<Data>(query: UseQueryResult<Data>): QueryState<Data> {
  return {
    data: query.data,
    error: query.error,
    isPending: query.isPending,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoadingMore: query.isPlaceholderData,
    retry: () => void query.refetch(),
  };
}
