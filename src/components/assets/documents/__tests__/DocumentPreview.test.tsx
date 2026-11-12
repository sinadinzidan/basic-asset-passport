import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { makeInstanceDetails } from '../../../../__mocks__/assets';
import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeCogniteSdkWrapper } from '../../../../__mocks__/CogniteSdkWrapper';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import type { CogniteFileViewer } from '../../../../cognite-file-viewer';
import type {
  CogniteFileViewerProps as CogniteFileViewerProperties,
  DocumentAnnotation,
} from '../../../../cognite-file-viewer/types';
import { AssetContext } from '../../../../hooks/assets/useAssetContext';
import { UseAssetDetailsContext } from '../../../../hooks/assets/useAssetDetails';
import { useNavigationState } from '../../../../hooks/general/useNavigationState';
import { NavigationProvider } from '../../../../providers/general/NavigationProvider';
import type { AssetDetailsService } from '../../../../services/assets/assetDetails';
import { DocumentPreview } from '../DocumentPreview';
import { DocumentViewerContext, type DocumentViewerContextType } from '../documentViewerContext';

const document = { space: 'sp-asset-passport-data', externalId: 'doc-1' };

describe(DocumentPreview.name, () => {
  let viewer: Mock<typeof CogniteFileViewer>;
  let context: DocumentViewerContextType;
  const client = makeMockClient();
  const SdkWrapper = makeCogniteSdkWrapper(client);

  beforeEach(() => {
    viewer = vi.fn<typeof CogniteFileViewer>(() => null);
    context = { CogniteFileViewer: viewer };
  });

  async function renderPreview() {
    const view = render(
      <SdkWrapper>
        <NavigationProvider api={null}>
          <DocumentViewerContext.Provider value={context}>
            <DocumentPreview document={document} />
          </DocumentViewerContext.Provider>
        </NavigationProvider>
      </SdkWrapper>,
    );
    await screen.findByRole('button', { name: 'Zoom in' });

    return view;
  }

  function viewerProperties(): CogniteFileViewerProperties {
    const properties = viewer.mock.lastCall?.[0];
    if (!properties) throw new Error('The viewer was not rendered.');

    return properties;
  }

  function loadDocument(pageCount: number): void {
    act(() => {
      viewerProperties().onDocumentLoad?.({ numPages: pageCount });
    });
  }

  it('views the document node by its instance ID with the signed-in client', async () => {
    await renderPreview();

    expect(viewerProperties()).toEqual(
      expect.objectContaining({
        source: {
          type: 'instanceId',
          space: 'sp-asset-passport-data',
          externalId: 'doc-1',
        },
        client,
      }),
    );
  });

  it('highlights the diagram annotations, such as P&ID boxes, on the page', async () => {
    await renderPreview();

    expect(viewerProperties().showAnnotations).toBe(true);
  });

  it('starts at 100% and lets the viewer zoom between 25% and 500%', async () => {
    await renderPreview();

    expect(viewerProperties()).toEqual(
      expect.objectContaining({ zoom: 1, minZoom: 0.25, maxZoom: 5 }),
    );
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent('100%');
  });

  it('zooms in and out in steps of 25%', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderPreview();

    // Act
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    // Assert
    expect(viewerProperties().zoom).toBe(1.5);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent('150%');

    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(viewerProperties().zoom).toBe(1.25);
  });

  it('returns to 100% from the percentage button', async () => {
    const user = userEvent.setup();
    await renderPreview();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));

    expect(viewerProperties().zoom).toBe(1);
  });

  it('follows the zoom the viewer reports from a pinch or Ctrl-wheel', async () => {
    await renderPreview();

    act(() => {
      viewerProperties().onZoomChange?.(2.4);
    });

    expect(viewerProperties().zoom).toBe(2.4);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent('240%');
  });

  it('cannot zoom out past the smallest zoom', async () => {
    await renderPreview();

    act(() => {
      viewerProperties().onZoomChange?.(0.25);
    });

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
  });

  it('cannot zoom in past the largest zoom', async () => {
    await renderPreview();

    act(() => {
      viewerProperties().onZoomChange?.(5);
    });

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('keeps the zoom controls for a one-page document', async () => {
    await renderPreview();

    loadDocument(1);

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });

  it('shows no page controls before the document has loaded', async () => {
    await renderPreview();

    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('shows no page controls for a one-page document', async () => {
    await renderPreview();

    loadDocument(1);

    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('starts on the first page of a multi-page document', async () => {
    await renderPreview();

    loadDocument(3);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(viewerProperties().page).toBe(1);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('goes to the next and the previous page', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderPreview();
    loadDocument(3);

    // Act
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    // Assert
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(viewerProperties().page).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('cannot go past the last page', async () => {
    const user = userEvent.setup();
    await renderPreview();
    loadDocument(2);

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('follows the page when the viewer changes it', async () => {
    await renderPreview();
    loadDocument(4);

    act(() => {
      viewerProperties().onPageChange?.(3);
    });

    expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
  });

  describe('clicking an annotation', () => {
    afterEach(() => {
      anchor.remove();
    });

    const linkedAsset = { space: 'asset-space', externalId: 'FLOC-9' };
    let anchor: HTMLElement;

    beforeEach(() => {
      anchor = globalThis.document.createElement('div');
      globalThis.document.body.appendChild(anchor);
    });

    async function renderWithAssets() {
      const detailsContext: AssetDetailsService = {
        getAssetDetails: vi.fn(() =>
          Promise.resolve(
            makeInstanceDetails({
              ...linkedAsset,
              properties: [{ identifier: 'name', label: 'Name', value: 'Feed Pump 9' }],
            }),
          ),
        ),
      };
      const QueryWrapper = makeQueryClientWrapper();

      const view = render(
        <SdkWrapper>
          <QueryWrapper>
            <AssetContext.Provider value={client}>
              <UseAssetDetailsContext.Provider
                value={{ createAssetDetailsService: () => detailsContext }}
              >
                <NavigationProvider api={null}>
                  <DocumentViewerContext.Provider value={context}>
                    <DocumentPreview document={document} />
                  </DocumentViewerContext.Provider>
                  <SelectedAssetProbe />
                </NavigationProvider>
              </UseAssetDetailsContext.Provider>
            </AssetContext.Provider>
          </QueryWrapper>
        </SdkWrapper>,
      );
      await screen.findByRole('button', { name: 'Zoom in' });

      return view;
    }

    function click(annotation: Partial<DocumentAnnotation>): void {
      act(() => {
        viewerProperties().onAnnotationClick?.(
          {
            id: 'a1',
            x: 0,
            y: 0,
            width: 0.1,
            height: 0.1,
            page: 1,
            resourceType: 'asset',
            annotationType: 'diagrams.AssetLink',
            linkedResource: linkedAsset,
            ...annotation,
          },
          anchor,
        );
      });
    }

    it('shows the linked asset in a popover at the clicked box', async () => {
      await renderWithAssets();

      click({});

      expect(await screen.findByRole('heading', { name: 'Feed Pump 9' })).toBeInTheDocument();
    });

    it('opens the asset in the app from that dialog', async () => {
      const user = userEvent.setup();
      await renderWithAssets();
      click({});

      await user.click(await screen.findByRole('button', { name: 'Open asset' }));

      expect(screen.getByText('Selected FLOC-9')).toBeInTheDocument();
    });

    it('closes the popover and stays on the document', async () => {
      const user = userEvent.setup();
      await renderWithAssets();
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });

    it('closes the popover when the zoom changes, because the box moves', async () => {
      const user = userEvent.setup();
      await renderWithAssets();
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      await user.click(screen.getByRole('button', { name: 'Zoom in' }));

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
    });

    it('closes the popover when the page changes', async () => {
      await renderWithAssets();
      loadDocument(3);
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      act(() => {
        viewerProperties().onPageChange?.(2);
      });

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
    });

    it('does nothing for an annotation that links to something other than an asset', async () => {
      await renderWithAssets();

      click({ resourceType: 'file', annotationType: 'diagrams.FileLink' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does nothing for an annotation with no linked resource', async () => {
      await renderWithAssets();

      click({ linkedResource: undefined });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

function SelectedAssetProbe() {
  const selectedAsset = useNavigationState((store) => store.navigationState.selectedAsset);

  return <p>{selectedAsset ? `Selected ${selectedAsset.externalId}` : 'Nothing selected'}</p>;
}
