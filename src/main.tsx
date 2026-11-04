import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from './constants/query';
import {
  defaultThemePreferenceDeps,
  resolveInitialTheme,
} from './hooks/theme/useThemePreference';

import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

// Apply the theme before the first render so the page does not flash.
defaultThemePreferenceDeps.applyDarkClass(
  resolveInitialTheme(defaultThemePreferenceDeps) === 'dark',
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
    },
  },
});

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
