import { useCogniteSdk } from '@cognite/app-sdk/react';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';

import { LoadingNotice } from '../../components/general';
import { DOCUMENT_PREVIEW_LOADING_MESSAGE } from '../../constants/documents';
import { DocumentFileContext } from '../../hooks/assets/documents/useDocumentFileContext';
import {
  DocumentPreviewContext,
  type RenderDocumentPreview,
} from '../../hooks/assets/documents/useDocumentPreview';
import { TimeseriesContext } from '../../hooks/assets/timeseries/useTimeseriesContext';
import { AssetContext } from '../../hooks/assets/useAssetContext';
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
    <AssetContext.Provider value={limitedClient}>
      <DocumentFileContext.Provider value={documentFileContext}>
        <TimeseriesContext.Provider value={timeseriesContext}>
          <DocumentPreviewContext.Provider value={renderDocumentPreview}>
            {children}
          </DocumentPreviewContext.Provider>
        </TimeseriesContext.Provider>
      </DocumentFileContext.Provider>
    </AssetContext.Provider>
  );
}
