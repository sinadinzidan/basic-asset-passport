import { useCogniteSdk } from '@cognite/app-sdk/react';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';

import { LoadingNotice } from '../../components/general';
import { DOCUMENT_PREVIEW_LOADING_MESSAGE } from '../../constants/documents';
import { DocumentFileClientContext } from '../../hooks/assets/documents/useDocumentFileClient';
import {
  DocumentPreviewRendererContext,
  type RenderDocumentPreview,
} from '../../hooks/assets/documents/useDocumentPreviewRenderer';
import { TimeseriesClientContext } from '../../hooks/assets/timeseries/useTimeseriesClient';
import { AssetClientContext } from '../../hooks/assets/useAssetClient';
import { limitCdfCalls } from '../../lib/limitedCdfClient';
import { createDocumentFileContext } from '../../services/assets/documents/documentFileContext';
import { createTimeseriesContext } from '../../services/assets/timeseries/timeseriesContext';

const DocumentPreview = lazy(() =>
  import('../../components/assets/documents/DocumentPreview').then((module) => ({
    default: module.DocumentPreview,
  })),
);

const renderDocumentPreview: RenderDocumentPreview = (document) => (
  <Suspense fallback={<LoadingNotice message={DOCUMENT_PREVIEW_LOADING_MESSAGE} />}>
    <DocumentPreview document={document} />
  </Suspense>
);

type AssetProviderProps = {
  children: ReactNode;
};

export function AssetProvider({ children }: AssetProviderProps) {
  const client = useCogniteSdk();

  const limitedClient = useMemo(() => limitCdfCalls(client), [client]);
  const documentFileContext = useMemo(
    () => createDocumentFileContext(limitedClient),
    [limitedClient],
  );
  const timeseriesContext = useMemo(() => createTimeseriesContext(limitedClient), [limitedClient]);

  return (
    <AssetClientContext.Provider value={limitedClient}>
      <DocumentFileClientContext.Provider value={documentFileContext}>
        <TimeseriesClientContext.Provider value={timeseriesContext}>
          <DocumentPreviewRendererContext.Provider value={renderDocumentPreview}>
            {children}
          </DocumentPreviewRendererContext.Provider>
        </TimeseriesClientContext.Provider>
      </DocumentFileClientContext.Provider>
    </AssetClientContext.Provider>
  );
}
