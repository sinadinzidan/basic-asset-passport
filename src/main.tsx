import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import { ErrorBoundary } from './components/general/ErrorBoundary';
import { IS_MOCK_MODE } from './constants/env';
import {
  defaultThemePreferenceDeps,
  resolveInitialTheme,
} from './hooks/theme/useThemePreference';
import { createAppQueryClient } from './lib/queryClient';
import type { AssetDataClient } from './types/assetDataClient';

import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

// Apply the theme before the first render so the page does not flash.
defaultThemePreferenceDeps.applyDarkClass(
  resolveInitialTheme(defaultThemePreferenceDeps) === 'dark',
);

const queryClient = createAppQueryClient();

// The dummy data is imported on demand, so it is left out of the bundle
// unless VITE_MOCK_MODE is "true" at build time.
async function loadMockDataClient(): Promise<AssetDataClient | undefined> {
  if (!IS_MOCK_MODE) return undefined;

  const { makeMockAssetDataClient } =
    await import('./mocks/mockAssetDataClient');
  return makeMockAssetDataClient();
}

async function bootstrap(container: HTMLElement): Promise<void> {
  const mockDataClient = await loadMockDataClient();

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App mockDataClient={mockDataClient} />
        </ErrorBoundary>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap(rootElement);
