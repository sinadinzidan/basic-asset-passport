import { useCogniteSdk } from '@cognite/app-sdk/react';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';

import { DocumentFileClientContext } from '../../hooks/assets/documents/useDocumentFileClient';
import {
  DocumentPreviewContext,
  type RenderDocumentPreview,
} from '../../hooks/assets/documents/useDocumentPreview';
import { AssetDataClientContext } from '../../hooks/assets/useAssetDataClient';
import { TimeseriesDatapointsClientContext } from '../../hooks/timeseries/useTimeseriesDatapointsClient';
import { createDocumentFileClient } from '../../services/assets/documents/documentFileClient';
import { createTimeseriesDatapointsClient } from '../../services/timeseries/timeseriesDatapointsClient';
import { LoadingNotice } from '../general/LoadingNotice';

// The PDF viewer is large, so it is only downloaded when a document is first viewed.
const LiveDocumentPreview = lazy(() =>
  import('./documents/LiveDocumentPreview').then((module) => ({
    default: module.LiveDocumentPreview,
  })),
);

const renderLiveDocumentPreview: RenderDocumentPreview = (document) => (
  <Suspense fallback={<LoadingNotice message="Loading preview..." />}>
    <LiveDocumentPreview document={document} />
  </Suspense>
);

type LiveAssetDataClientProviderProps = {
  children: ReactNode;
};

/**
 * Provides the authenticated Flows SDK client to the asset hooks, and the
 * file upload and preview for documents and the timeseries trends built on it.
 */
export function LiveAssetDataClientProvider({
  children,
}: LiveAssetDataClientProviderProps) {
  const client = useCogniteSdk();

  const documentFileClient = useMemo(
    () => createDocumentFileClient(client),
    [client],
  );

  const timeseriesDatapointsClient = useMemo(
    () => createTimeseriesDatapointsClient(client),
    [client],
  );

  return (
    <AssetDataClientContext.Provider value={client}>
      <DocumentFileClientContext.Provider value={documentFileClient}>
        <TimeseriesDatapointsClientContext.Provider
          value={timeseriesDatapointsClient}
        >
          <DocumentPreviewContext.Provider value={renderLiveDocumentPreview}>
            {children}
          </DocumentPreviewContext.Provider>
        </TimeseriesDatapointsClientContext.Provider>
      </DocumentFileClientContext.Provider>
    </AssetDataClientContext.Provider>
  );
}
