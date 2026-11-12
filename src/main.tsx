import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import { ErrorBoundary } from './components/general';
import { isMockMode } from './constants/env';
import { createAppQueryClient } from './lib/queryClient';
import type { MockContexts } from './types/mockContext';

import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

const queryClient = createAppQueryClient();

async function loadMockContexts(): Promise<MockContexts | undefined> {
  if (!isMockMode) return undefined;

  const { makeMockAssetContext, makeMockDocumentFileContext } =
    await import('./__mocks__/mockAssetContext');
  const { makeMockTimeseriesContext } = await import('./__mocks__/mockTimeseriesContext');
  const { makeMockAgentContext } = await import('./__mocks__/mockAgentContext');
  const assetContext = makeMockAssetContext();
  return {
    assetContext,
    documentFileContext: makeMockDocumentFileContext(assetContext),
    timeseriesContext: makeMockTimeseriesContext(),
    agentContext: makeMockAgentContext(),
  };
}

async function bootstrap(container: HTMLElement): Promise<void> {
  const mockContexts = await loadMockContexts();

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App mockContexts={mockContexts} />
        </ErrorBoundary>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap(rootElement);
