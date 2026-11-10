import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { CogniteFileViewer } from '../../../../cognite-file-viewer';
import type { CogniteFileViewerProps , DocumentAnnotation } from '../../../../cognite-file-viewer/types';
import {
  LiveDocumentPreviewContext,
  type LiveDocumentPreviewContextType,
} from '../../../../hooks/assets/documents/LiveDocumentPreviewContext';
import {
  UseAssetEquipmentDetailsContext,
  type UseAssetEquipmentDetailsContextType,
} from '../../../../hooks/assets/useAssetEquipmentDetails';
import { OpenAssetContext } from '../../../../hooks/assets/useOpenAsset';
import { makeInstanceDetails } from '../../../../mocks/assets';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import { LiveDocumentPreview } from '../LiveDocumentPreview';

const document = { space: 'sp-asset-passport-data', externalId: 'doc-1' };

describe(LiveDocumentPreview.name, () => {
  let viewer: Mock<typeof CogniteFileViewer>;
  let context: LiveDocumentPreviewContextType;
  const client = makeMockClient();

  beforeEach(() => {
    viewer = vi.fn<typeof CogniteFileViewer>(() => null);
    context = {
      useCogniteSdk: vi.fn(() => client),
      CogniteFileViewer: viewer,
    };
  });

  function renderPreview() {
    return render(
      <LiveDocumentPreviewContext.Provider value={context}>
        <LiveDocumentPreview document={document} />
      </LiveDocumentPreviewContext.Provider>,
    );
  }

  function viewerProps(): CogniteFileViewerProps {
    const props = viewer.mock.lastCall?.[0];
    if (!props) throw new Error('The viewer was not rendered.');

    return props;
  }

  function loadDocument(numPages: number): void {
    act(() => {
      viewerProps().onDocumentLoad?.({ numPages });
    });
  }

  it('views the document node by its instance ID with the signed-in client', () => {
    renderPreview();

    expect(viewerProps()).toEqual(
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

  it('highlights the diagram annotations, such as P&ID boxes, on the page', () => {
    renderPreview();

    expect(viewerProps().showAnnotations).toBe(true);
  });

  it('starts at 100% and lets the viewer zoom between 25% and 500%', () => {
    renderPreview();

    expect(viewerProps()).toEqual(
      expect.objectContaining({ zoom: 1, minZoom: 0.25, maxZoom: 5 }),
    );
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent(
      '100%',
    );
  });

  it('zooms in and out in steps of 25%', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPreview();

    // Act
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    // Assert
    expect(viewerProps().zoom).toBe(1.5);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent(
      '150%',
    );

    await user.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(viewerProps().zoom).toBe(1.25);
  });

  it('returns to 100% from the percentage button', async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));

    await user.click(screen.getByRole('button', { name: 'Reset zoom' }));

    expect(viewerProps().zoom).toBe(1);
  });

  it('follows the zoom the viewer reports from a pinch or Ctrl-wheel', () => {
    renderPreview();

    act(() => {
      viewerProps().onZoomChange?.(2.4);
    });

    expect(viewerProps().zoom).toBe(2.4);
    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent(
      '240%',
    );
  });

  it('cannot zoom out past the smallest zoom', () => {
    renderPreview();

    act(() => {
      viewerProps().onZoomChange?.(0.25);
    });

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled();
  });

  it('cannot zoom in past the largest zoom', () => {
    renderPreview();

    act(() => {
      viewerProps().onZoomChange?.(5);
    });

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
  });

  it('keeps the zoom controls for a one-page document', () => {
    renderPreview();

    loadDocument(1);

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
  });

  it('shows no page controls before the document has loaded', () => {
    renderPreview();

    expect(
      screen.queryByRole('button', { name: 'Next page' }),
    ).not.toBeInTheDocument();
  });

  it('shows no page controls for a one-page document', () => {
    renderPreview();

    loadDocument(1);

    expect(
      screen.queryByRole('button', { name: 'Next page' }),
    ).not.toBeInTheDocument();
  });

  it('starts on the first page of a multi-page document', () => {
    renderPreview();

    loadDocument(3);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(viewerProps().page).toBe(1);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('goes to the next and the previous page', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPreview();
    loadDocument(3);

    // Act
    await user.click(screen.getByRole('button', { name: 'Next page' }));

    // Assert
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(viewerProps().page).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('cannot go past the last page', async () => {
    const user = userEvent.setup();
    renderPreview();
    loadDocument(2);

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('follows the page when the viewer changes it', () => {
    renderPreview();
    loadDocument(4);

    act(() => {
      viewerProps().onPageChange?.(3);
    });

    expect(screen.getByText('Page 3 of 4')).toBeInTheDocument();
  });

  describe('clicking an annotation', () => {
    afterEach(() => {
      anchor.remove();
    });

    const linkedAsset = { space: 'asset-space', externalId: 'FLOC-9' };
    let openAsset: (asset: { space: string; externalId: string }) => void;
    let anchor: HTMLElement;

    beforeEach(() => {
      openAsset = vi.fn();
      anchor = globalThis.document.createElement('div');
      globalThis.document.body.appendChild(anchor);
    });

    function renderWithAssets() {
      const detailsContext: UseAssetEquipmentDetailsContextType = {
        useAssetDataClient: vi.fn(() => client),
        getAssetEquipmentDetails: vi.fn(() =>
          Promise.resolve({
            asset: makeInstanceDetails({
              ...linkedAsset,
              properties: [{ identifier: 'name', label: 'Name', value: 'Feed Pump 9' }],
            }),
            equipment: [],
          }),
        ),
      };
      const QueryWrapper = makeQueryClientWrapper();

      return render(
        <QueryWrapper>
          <UseAssetEquipmentDetailsContext.Provider value={detailsContext}>
            <OpenAssetContext.Provider value={openAsset}>
              <LiveDocumentPreviewContext.Provider value={context}>
                <LiveDocumentPreview document={document} />
              </LiveDocumentPreviewContext.Provider>
            </OpenAssetContext.Provider>
          </UseAssetEquipmentDetailsContext.Provider>
        </QueryWrapper>,
      );
    }

    function click(annotation: Partial<DocumentAnnotation>): void {
      act(() => {
        viewerProps().onAnnotationClick?.(
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
      renderWithAssets();

      click({});

      expect(await screen.findByRole('heading', { name: 'Feed Pump 9' })).toBeInTheDocument();
    });

    it('opens the asset in the app from that dialog', async () => {
      const user = userEvent.setup();
      renderWithAssets();
      click({});

      await user.click(await screen.findByRole('button', { name: 'Open asset' }));

      expect(openAsset).toHaveBeenCalledExactlyOnceWith(linkedAsset);
    });

    it('closes the popover and stays on the document', async () => {
      const user = userEvent.setup();
      renderWithAssets();
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });

    it('closes the popover when the zoom changes, because the box moves', async () => {
      const user = userEvent.setup();
      renderWithAssets();
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      await user.click(screen.getByRole('button', { name: 'Zoom in' }));

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
    });

    it('closes the popover when the page changes', async () => {
      renderWithAssets();
      loadDocument(3);
      click({});
      await screen.findByRole('heading', { name: 'Feed Pump 9' });

      act(() => {
        viewerProps().onPageChange?.(2);
      });

      expect(screen.queryByRole('heading', { name: 'Feed Pump 9' })).not.toBeInTheDocument();
    });

    it('does nothing for an annotation that links to something other than an asset', () => {
      renderWithAssets();

      click({ resourceType: 'file', annotationType: 'diagrams.FileLink' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does nothing for an annotation with no linked resource', () => {
      renderWithAssets();

      click({ linkedResource: undefined });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
