import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import { ErrorBoundary } from './components/general/ErrorBoundary';
import { IS_MOCK_MODE } from './constants/env';
import { createAppQueryClient } from './lib/queryClient';
import type { AgentClient } from './types/agent';
import type { AssetDataClient } from './types/assetDataClient';
import type { DocumentFileClient } from './types/documentFileClient';
import type { TimeseriesDatapointsClient } from './types/timeseries';

import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html.');
}

const queryClient = createAppQueryClient();

// The dummy data is imported on demand, so it is left out of the bundle
// unless VITE_MOCK_MODE is "true" at build time.
type MockClients = {
  agentClient: AgentClient;
  dataClient: AssetDataClient;
  documentFileClient: DocumentFileClient;
  timeseriesDatapointsClient: TimeseriesDatapointsClient;
};

async function loadMockClients(): Promise<MockClients | undefined> {
  if (!IS_MOCK_MODE) return undefined;

  const { makeMockAssetDataClient, makeMockDocumentFileClient } =
    await import('./mocks/mockAssetDataClient');
  const { makeMockAgentClient } = await import('./mocks/mockAgentClient');
  const { makeMockTimeseriesDatapointsClient } = await import(
    './mocks/mockTimeseriesDatapointsClient'
  );
  const dataClient = makeMockAssetDataClient();
  return {
    agentClient: makeMockAgentClient(),
    dataClient,
    documentFileClient: makeMockDocumentFileClient(dataClient),
    timeseriesDatapointsClient: makeMockTimeseriesDatapointsClient(),
  };
}

async function bootstrap(container: HTMLElement): Promise<void> {
  const mockClients = await loadMockClients();

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App
            mockDataClient={mockClients?.dataClient}
            mockDocumentFileClient={mockClients?.documentFileClient}
            mockTimeseriesDatapointsClient={
              mockClients?.timeseriesDatapointsClient
            }
            mockAgentClient={mockClients?.agentClient}
          />
        </ErrorBoundary>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap(rootElement);
