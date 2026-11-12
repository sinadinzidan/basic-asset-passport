import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactNode } from 'react';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function makeQueryClientWrapper(
  queryClient: QueryClient = makeTestQueryClient(),
): ComponentType<{ children: ReactNode }> {
  return function QueryClientWrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
