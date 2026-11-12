import { useCogniteSdk } from '@cognite/app-sdk/react';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';

import { LoadingNotice } from '../../components/general/LoadingNotice';
import { DocumentFileContext } from '../../hooks/assets/documents/useDocumentFileContext';
import {
  DocumentPreviewContext,
  type RenderDocumentPreview,
} from '../../hooks/assets/documents/useDocumentPreview';
import { TimeseriesContext } from '../../hooks/assets/timeseries/useTimeseriesContext';
import { AssetContext } from '../../hooks/assets/useAssetContext';
import { createDocumentFileContext } from '../../services/assets/documents/documentFileContext';
import { createTimeseriesContext } from '../../services/assets/timeseries/timeseriesContext';

const DocumentPreview = lazy(() =>
  import('../../components/assets/documents/DocumentPreview').then((module) => ({
    default: module.DocumentPreview,
  })),
);

const renderDocumentPreview: RenderDocumentPreview = (document) => (
  <Suspense fallback={<LoadingNotice message="Loading preview..." />}>
    <DocumentPreview document={document} />
  </Suspense>
);

type AssetProviderProps = {
  children: ReactNode;
};

export function AssetProvider({ children }: AssetProviderProps) {
  const client = useCogniteSdk();

  const documentFileContext = useMemo(() => createDocumentFileContext(client), [client]);

  const timeseriesContext = useMemo(() => createTimeseriesContext(client), [client]);

  return (
    <AssetContext.Provider value={client}>
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
