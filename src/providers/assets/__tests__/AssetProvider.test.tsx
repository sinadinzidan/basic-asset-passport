import type { CogniteClient } from '@cognite/sdk';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DocumentViewerContext,
  type DocumentViewerContextType,
} from '../../../components/assets/documents/documentViewerContext';
import { useDocumentFileContext } from '../../../hooks/assets/documents/useDocumentFileContext';
import { useDocumentPreview } from '../../../hooks/assets/documents/useDocumentPreview';
import { useTimeseriesContext } from '../../../hooks/assets/timeseries/useTimeseriesContext';
import { useAssetContext } from '../../../hooks/assets/useAssetContext';
import { makeOfflineSdkClient } from '../../../mocks/cogniteClient';
import { makeCogniteSdkWrapper } from '../../../mocks/CogniteSdkWrapper';
import { NavigationProvider } from '../../general/NavigationProvider';
import { AssetProvider } from '../AssetProvider';

const document = { space: 'sp-asset-passport-data', externalId: 'doc-1' };

describe(AssetProvider.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
  });

  it('gives its children the signed-in client to read assets with', async () => {
    let assetContext: ReturnType<typeof useAssetContext> | undefined;
    function AssetProbe() {
      assetContext = useAssetContext();

      return <p>Assets of {assetContext.project}</p>;
    }

    render(
      <AssetProvider>
        <AssetProbe />
      </AssetProvider>,
      { wrapper: makeCogniteSdkWrapper(client) },
    );

    expect(await screen.findByText('Assets of my-project')).toBeInTheDocument();
    expect(assetContext).toBe(client);
  });

  it('gives its children the datapoints of the signed-in project', async () => {
    function TimeseriesProbe() {
      return <p>Timeseries of {useTimeseriesContext().project}</p>;
    }

    render(
      <AssetProvider>
        <TimeseriesProbe />
      </AssetProvider>,
      { wrapper: makeCogniteSdkWrapper(client) },
    );

    expect(await screen.findByText('Timeseries of my-project')).toBeInTheDocument();
  });

  it('gives its children the upload links of the signed-in client', async () => {
    const post = vi.spyOn(client, 'post').mockResolvedValue({
      data: { items: [{ uploadUrl: 'https://upload.test/doc-1' }] },
      status: 200,
      headers: {},
    });
    let files: ReturnType<typeof useDocumentFileContext> | undefined;
    function FilesProbe() {
      files = useDocumentFileContext();

      return <p>Files ready</p>;
    }
    render(
      <AssetProvider>
        <FilesProbe />
      </AssetProvider>,
      { wrapper: makeCogniteSdkWrapper(client) },
    );
    await screen.findByText('Files ready');

    await expect(files?.requestUploadUrl(document)).resolves.toBe('https://upload.test/doc-1');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('previews a document with the file viewer, loaded on demand', async () => {
    const viewerContext: DocumentViewerContextType = {
      CogniteFileViewer: ({ source }) =>
        'externalId' in source ? <p>Viewing {source.externalId}</p> : null,
    };
    function PreviewProbe() {
      const renderPreview = useDocumentPreview();

      return renderPreview ? renderPreview(document) : <p>No preview</p>;
    }

    render(
      <NavigationProvider api={null}>
        <DocumentViewerContext.Provider value={viewerContext}>
          <AssetProvider>
            <PreviewProbe />
          </AssetProvider>
        </DocumentViewerContext.Provider>
      </NavigationProvider>,
      { wrapper: makeCogniteSdkWrapper(client) },
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Loading preview...');
    expect(await screen.findByText('Viewing doc-1')).toBeInTheDocument();
  });
});
