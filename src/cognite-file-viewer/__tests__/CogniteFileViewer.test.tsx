import type { CogniteClient } from '@cognite/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../__mocks__/cogniteClient';
import { CogniteFileViewer } from '../CogniteFileViewer';
import { clearAllFileCache } from '../fileResolution';
import { clearAnnotationCache } from '../useDocumentAnnotations';

const pdf = vi.hoisted(() => ({ pageCount: 3 }));

// pdf.js needs a real canvas and a worker, which the test DOM does not have,
// so the two react-pdf components are replaced with ones that report a load.
vi.mock('react-pdf', () => {
  type DocumentProps = {
    file: string;
    loading: ReactNode;
    error: ReactNode;
    children: ReactNode;
    onLoadSuccess: (document: { numPages: number }) => void;
  };
  type PageProps = {
    pageNumber: number;
    width?: number;
    scale: number;
    rotate: number;
    onLoadSuccess: (page: { originalWidth: number; originalHeight: number }) => void;
  };

  function Document({ file, loading, error, children, onLoadSuccess }: DocumentProps) {
    useEffect(() => {
      onLoadSuccess({ numPages: pdf.pageCount });
    }, [onLoadSuccess]);
    return (
      <div data-testid="pdf-document" data-file={file}>
        <div data-testid="pdf-loading">{loading}</div>
        <div data-testid="pdf-error">{error}</div>
        {children}
      </div>
    );
  }

  function Page({ pageNumber, width, scale, rotate, onLoadSuccess }: PageProps) {
    useEffect(() => {
      onLoadSuccess({ originalWidth: 600, originalHeight: 800 });
    }, [onLoadSuccess]);
    return (
      <div
        data-testid="pdf-page"
        data-page={pageNumber}
        data-width={width}
        data-scale={scale}
        data-rotate={rotate}
      />
    );
  }

  return { Document, Page, pdfjs: { GlobalWorkerOptions: {} } };
});

const PDF_SOURCE = { type: 'url', url: 'https://files.test/manual.pdf' } as const;
const IMAGE_SOURCE = { type: 'url', url: 'https://files.test/photo.png' } as const;
const TEXT_SOURCE = { type: 'url', url: 'https://files.test/notes.txt' } as const;

describe('CogniteFileViewer', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
  let revokeObjectUrl: ReturnType<typeof vi.fn<typeof URL.revokeObjectURL>>;

  beforeEach(() => {
    pdf.pageCount = 3;
    clearAllFileCache();
    clearAnnotationCache();
    fetchMock = vi.fn<typeof fetch>();
    revokeObjectUrl = vi.fn<typeof URL.revokeObjectURL>();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:photo');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectUrl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  describe('before the file is resolved', () => {
    it('says the file is loading', () => {
      const client = makeOfflineSdkClient('my-project');
      vi.spyOn(client.files, 'retrieve').mockReturnValue(new Promise(() => {}));

      render(<CogniteFileViewer source={{ type: 'internalId', id: 7 }} client={client} />);

      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('shows the loading content of its caller instead', () => {
      const client = makeOfflineSdkClient('my-project');
      vi.spyOn(client.files, 'retrieve').mockReturnValue(new Promise(() => {}));

      render(
        <CogniteFileViewer
          source={{ type: 'internalId', id: 7 }}
          client={client}
          renderLoading={() => <p>One moment</p>}
        />,
      );

      expect(screen.getByText('One moment')).toBeInTheDocument();
    });

    it('says why the file could not be resolved', async () => {
      render(<CogniteFileViewer source={{ type: 'internalId', id: 7 }} />);

      expect(
        await screen.findByText(
          'Failed to load file: CogniteClient is required for instanceId and internalId sources',
        ),
      ).toBeInTheDocument();
    });

    it('hands the error to its caller to show', async () => {
      render(
        <CogniteFileViewer
          source={{ type: 'internalId', id: 7 }}
          renderError={(error) => <p>Sorry: {error.message}</p>}
        />,
      );

      expect(await screen.findByText(/^Sorry: CogniteClient is required/)).toBeInTheDocument();
    });

    it('reports a source that resolved to no URL', async () => {
      render(<CogniteFileViewer source={{ type: 'url', url: '' }} />);

      expect(await screen.findByText('Failed to load file: No URL resolved')).toBeInTheDocument();
    });

    it('hands a missing URL to its caller as an error', async () => {
      render(
        <CogniteFileViewer
          source={{ type: 'url', url: '' }}
          renderError={(error) => <p>Sorry: {error.message}</p>}
        />,
      );

      expect(await screen.findByText('Sorry: No URL resolved')).toBeInTheDocument();
    });
  });

  describe('a file it cannot show', () => {
    it('names the type it does not support', async () => {
      render(
        <CogniteFileViewer
          source={{ type: 'url', url: 'https://files.test/clip', mimeType: 'video/mp4' }}
        />,
      );

      expect(await screen.findByText('Unsupported file type: video/mp4')).toBeInTheDocument();
    });

    it('says so without a type when it knows none', async () => {
      render(<CogniteFileViewer source={{ type: 'url', url: 'https://files.test/clip' }} />);

      expect(await screen.findByText('Unsupported file type')).toBeInTheDocument();
    });

    it('lets its caller show something else', async () => {
      render(
        <CogniteFileViewer
          source={{ type: 'url', url: 'https://files.test/clip', mimeType: 'video/mp4' }}
          renderUnsupported={(mimeType) => <p>Cannot show {mimeType}</p>}
        />,
      );

      expect(await screen.findByText('Cannot show video/mp4')).toBeInTheDocument();
    });
  });

  describe('a text file', () => {
    it('shows the text', async () => {
      fetchMock.mockResolvedValue(new Response('line one'));

      render(<CogniteFileViewer source={TEXT_SOURCE} />);

      expect(await screen.findByText('line one')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(TEXT_SOURCE.url);
    });

    it('reports the status of a failed download', async () => {
      fetchMock.mockResolvedValue(new Response('', { status: 404 }));

      render(<CogniteFileViewer source={TEXT_SOURCE} />);

      expect(await screen.findByText('Failed to load file: HTTP 404')).toBeInTheDocument();
    });

    it('reports a failure that is not an error', async () => {
      fetchMock.mockRejectedValue('offline');

      render(<CogniteFileViewer source={TEXT_SOURCE} />);

      expect(await screen.findByText('Failed to load file: offline')).toBeInTheDocument();
    });

    it('ignores a download that finishes after it is gone', async () => {
      let finish: (response: Response) => void = () => {};
      fetchMock.mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { unmount } = render(<CogniteFileViewer source={TEXT_SOURCE} />);
      await screen.findByText('Loading file...');

      unmount();
      finish(new Response('late'));
      await Promise.resolve();

      expect(screen.queryByText('late')).not.toBeInTheDocument();
    });

    it('ignores a download that fails after it is gone', async () => {
      let fail: (reason: Error) => void = () => {};
      fetchMock.mockReturnValue(
        new Promise((_, reject) => {
          fail = reject;
        }),
      );
      const { unmount } = render(<CogniteFileViewer source={TEXT_SOURCE} />);
      await screen.findByText('Loading file...');

      unmount();
      fail(new Error('late'));
      await Promise.resolve();

      expect(screen.queryByText(/late/)).not.toBeInTheDocument();
    });
  });

  describe('an image', () => {
    beforeEach(() => {
      fetchMock.mockImplementation(() => Promise.resolve(new Response('image-bytes')));
    });

    it('measures the image before it shows it', async () => {
      const { container } = render(<CogniteFileViewer source={IMAGE_SOURCE} />);

      await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
      expect(container.querySelector('img')).toHaveStyle({ visibility: 'hidden' });
      expect(screen.getByText('Loading file...')).toBeInTheDocument();
    });

    it('shows the loading content of its caller while it downloads and measures', async () => {
      const { container } = render(
        <CogniteFileViewer source={IMAGE_SOURCE} renderLoading={() => <p>One moment</p>} />,
      );

      await screen.findByText('One moment');
      await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
      expect(screen.getByText('One moment')).toBeInTheDocument();
    });

    it('shows the image at its own size once it is measured', async () => {
      const { container } = render(<CogniteFileViewer source={IMAGE_SOURCE} />);

      await loadImage(container, 800, 400);

      const image = container.querySelector('img');
      expect(image).toHaveAttribute('src', 'blob:photo');
      expect(image).toHaveStyle({ width: '800px' });
      expect(image?.parentElement).toHaveStyle({ width: '800px', height: '400px' });
    });

    it('swaps width and height for a quarter turn and scales with the zoom', async () => {
      const { container } = render(
        <CogniteFileViewer
          source={IMAGE_SOURCE}
          rotation={90}
          zoom={2}
          panOffset={{ x: 10, y: 20 }}
        />,
      );

      await loadImage(container, 800, 400);

      const frame = container.querySelector('img')?.parentElement;
      expect(frame).toHaveStyle({ width: '800px', height: '1600px' });
      expect(frame?.parentElement).toHaveStyle({ transform: 'translate(10px, 20px)' });
    });

    it('gives its caller the measurements for an overlay', async () => {
      const renderOverlay = vi.fn(() => <p>Overlay</p>);
      const { container } = render(
        <CogniteFileViewer source={IMAGE_SOURCE} renderOverlay={renderOverlay} />,
      );

      await loadImage(container, 800, 400);

      expect(screen.getByText('Overlay')).toBeInTheDocument();
      expect(renderOverlay).toHaveBeenLastCalledWith({
        width: 800,
        height: 400,
        originalWidth: 800,
        originalHeight: 400,
        pageNumber: 1,
        rotation: 0,
      });
    });

    it('reports a failed download, to its caller when asked', async () => {
      fetchMock.mockImplementation(() => Promise.resolve(new Response('', { status: 500 })));

      const first = render(<CogniteFileViewer source={IMAGE_SOURCE} />);
      expect(await screen.findByText('Failed to load file: HTTP 500')).toBeInTheDocument();
      first.unmount();

      fetchMock.mockImplementation(() => Promise.reject('offline'));
      render(
        <CogniteFileViewer
          source={IMAGE_SOURCE}
          renderError={(error) => <p>Sorry: {error.message}</p>}
        />,
      );
      expect(await screen.findByText('Sorry: offline')).toBeInTheDocument();
    });

    it('measures again and releases the old image when the file changes', async () => {
      const { container, rerender } = render(<CogniteFileViewer source={IMAGE_SOURCE} />);
      await loadImage(container, 800, 400);

      rerender(
        <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/other.png' }} />,
      );

      await waitFor(() => expect(revokeObjectUrl).toHaveBeenCalledWith('blob:photo'));
      await waitFor(() =>
        expect(container.querySelector('img')).toHaveStyle({ visibility: 'hidden' }),
      );
    });

    it('releases the image when it is gone', async () => {
      const { container, unmount } = render(<CogniteFileViewer source={IMAGE_SOURCE} />);
      await loadImage(container, 800, 400);

      unmount();

      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:photo');
    });

    it('ignores a download that finishes or fails after it is gone', async () => {
      let finish: (response: Response) => void = () => {};
      let fail: (reason: Error) => void = () => {};
      fetchMock
        .mockReturnValueOnce(
          new Promise((resolve) => {
            finish = resolve;
          }),
        )
        .mockReturnValueOnce(
          new Promise((_, reject) => {
            fail = reject;
          }),
        );
      const first = render(<CogniteFileViewer source={IMAGE_SOURCE} />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      first.unmount();
      const second = render(<CogniteFileViewer source={IMAGE_SOURCE} />);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      second.unmount();

      finish(new Response('late'));
      fail(new Error('late'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('a PDF', () => {
    it('shows the first page and reports how many pages there are', async () => {
      const onDocumentLoad = vi.fn();

      render(<CogniteFileViewer source={PDF_SOURCE} onDocumentLoad={onDocumentLoad} />);

      expect(await screen.findByTestId('pdf-page')).toHaveAttribute('data-page', '1');
      expect(screen.getByTestId('pdf-document')).toHaveAttribute('data-file', PDF_SOURCE.url);
      expect(onDocumentLoad).toHaveBeenCalledWith({ numPages: 3 });
      expect(screen.getByTestId('pdf-loading')).toHaveTextContent('Loading file...');
      expect(screen.getByTestId('pdf-error')).toHaveTextContent(
        'Failed to load file: Failed to load PDF',
      );
    });

    it('shows the page, zoom and rotation its caller controls', async () => {
      render(<CogniteFileViewer source={PDF_SOURCE} page={2} zoom={1.5} rotation={90} />);

      const page = await screen.findByTestId('pdf-page');
      expect(page).toHaveAttribute('data-page', '2');
      expect(page).toHaveAttribute('data-scale', '1.5');
      expect(page).toHaveAttribute('data-rotate', '90');
    });

    it('goes back to the first page when the document has fewer pages', async () => {
      pdf.pageCount = 2;
      const onPageChange = vi.fn();

      render(<CogniteFileViewer source={PDF_SOURCE} page={5} onPageChange={onPageChange} />);

      await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(1));
    });

    it('hands the loading and error content of its caller to the document', async () => {
      render(
        <CogniteFileViewer
          source={PDF_SOURCE}
          renderLoading={() => <span>One moment</span>}
          renderError={(error) => <span>Sorry: {error.message}</span>}
        />,
      );

      expect(await screen.findByTestId('pdf-loading')).toHaveTextContent('One moment');
      expect(screen.getByTestId('pdf-error')).toHaveTextContent('Sorry: Failed to load PDF');
    });

    it('fits the page to the width of its container', async () => {
      stubElementSize(400, 300);

      render(<CogniteFileViewer source={PDF_SOURCE} fitMode="width" />);

      await waitFor(() =>
        expect(screen.getByTestId('pdf-page')).toHaveAttribute('data-width', '400'),
      );
    });

    it('moves the page by the pan offset when it is zoomed in', async () => {
      render(<CogniteFileViewer source={PDF_SOURCE} zoom={2} panOffset={{ x: 5, y: 6 }} />);

      const page = await screen.findByTestId('pdf-page');
      expect(page.parentElement).toHaveStyle({ transform: 'translate(5px, 6px)' });
    });

    it('gives its caller the page measurements for an overlay', async () => {
      stubElementSize(400, 300);
      const renderOverlay = vi.fn(() => <p>Overlay</p>);

      render(<CogniteFileViewer source={PDF_SOURCE} page={2} renderOverlay={renderOverlay} />);

      expect(await screen.findByText('Overlay')).toBeInTheDocument();
      expect(renderOverlay).toHaveBeenLastCalledWith({
        width: 400,
        height: 300,
        originalWidth: 600,
        originalHeight: 800,
        pageNumber: 2,
        rotation: 0,
      });
    });

    it('draws the annotations of a CDF file over the page', async () => {
      stubElementSize(400, 300);
      const client = makeAnnotatedClient();
      const onAnnotationClick = vi.fn();

      const { container } = render(
        <CogniteFileViewer
          source={{ type: 'instanceId', space: 'files', externalId: 'doc-1' }}
          client={client}
          onAnnotationClick={onAnnotationClick}
        />,
      );

      await waitFor(() => expect(client.instances.query).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(container.querySelector('svg')).not.toBeNull());
    });

    it('reads no annotations when they are switched off', async () => {
      const client = makeAnnotatedClient();

      render(
        <CogniteFileViewer
          source={{ type: 'instanceId', space: 'files', externalId: 'doc-1' }}
          client={client}
          showAnnotations={false}
        />,
      );

      await screen.findByTestId('pdf-page');
      expect(client.instances.query).not.toHaveBeenCalled();
    });
  });
});

async function loadImage(container: HTMLElement, width: number, height: number): Promise<void> {
  await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
  const image = container.querySelector('img');
  if (!image) throw new Error('No image');
  Object.defineProperty(image, 'naturalWidth', { value: width, configurable: true });
  Object.defineProperty(image, 'naturalHeight', { value: height, configurable: true });
  fireEvent.load(image);
  await waitFor(() =>
    expect(container.querySelector('img')).not.toHaveStyle({ visibility: 'hidden' }),
  );
}

function stubElementSize(width: number, height: number): void {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    get: () => width,
    configurable: true,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    get: () => height,
    configurable: true,
  });
}

function makeAnnotatedClient(): CogniteClient {
  const client = makeOfflineSdkClient('my-project');
  vi.spyOn(client.files, 'retrieve').mockResolvedValue([
    {
      id: 7,
      name: 'manual.pdf',
      mimeType: 'application/pdf',
      uploaded: true,
      createdTime: new Date(0),
      lastUpdatedTime: new Date(0),
    },
  ]);
  vi.spyOn(client, 'post').mockResolvedValue({
    data: { items: [{ downloadUrl: 'https://files.test/7' }] },
    status: 200,
    headers: {},
  });
  vi.spyOn(client.instances, 'query').mockResolvedValue({
    items: {
      annotations: [
        {
          instanceType: 'edge',
          space: 'annotations',
          externalId: 'edge-1',
          version: 1,
          createdTime: 0,
          lastUpdatedTime: 0,
          type: { space: 'cdf_cdm', externalId: 'diagrams.AssetLink' },
          startNode: { space: 'files', externalId: 'doc-1' },
          endNode: { space: 'assets', externalId: 'PUMP-1' },
          properties: {
            cdf_cdm: {
              'CogniteDiagramAnnotation/v1': {
                startNodeXMin: 0.1,
                startNodeXMax: 0.3,
                startNodeYMin: 0.2,
                startNodeYMax: 0.6,
                startNodePageNumber: 1,
              },
            },
          },
        },
      ],
    },
    nextCursor: {},
  });
  return client;
}
