import { CogniteClient } from '@cognite/sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TEXT_PREVIEW_MAX_CHARS } from '../../constants/fileViewer';
import { CogniteFileViewer } from '../CogniteFileViewer';

// PDF.js needs a browser canvas and worker; exercise its document contract here.
vi.mock('react-pdf', () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: ({ children, onLoadSuccess }: { children: ReactNode; onLoadSuccess: (info: { numPages: number }) => void }) => (
    <div><button onClick={() => onLoadSuccess({ numPages: 3 })}>PDF ready</button>{children}</div>
  ),
  Page: ({ pageNumber }: { pageNumber: number }) => <div role="img" aria-label={`Diagram page ${pageNumber}`} />,
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CogniteFileViewer', () => {
  it('renders a PDF and forwards document page counts', async () => {
    const onDocumentLoad = vi.fn();
    const { rerender } = render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/PID.pdf' }} onDocumentLoad={onDocumentLoad} />
    ));
    expect(await screen.findByRole('img', { name: 'Diagram page 1' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'PDF ready' }));
    expect(onDocumentLoad).toHaveBeenCalledWith({ numPages: 3 });
    rerender(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/PID.pdf' }} page={2} />
    ));
    expect(await screen.findByRole('img', { name: 'Diagram page 2' })).toBeInTheDocument();
  });

  it('shows the custom unsupported and error renderers', async () => {
    const { rerender } = render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/file.bin' }} renderUnsupported={() => <p>No preview</p>} />
    ));
    expect(await screen.findByText('No preview')).toBeInTheDocument();
    const client = new CogniteClient({ appId: 'test', project: 'test', oidcTokenProvider: async () => 'test' });
    vi.spyOn(client.files, 'retrieve').mockRejectedValue(new Error('Forbidden'));
    rerender(withQueries(
      <CogniteFileViewer source={{ type: 'internalId', id: 123 }} client={client} renderError={(error: Error) => <p role="alert">{error.message}</p>} />
    ));
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  });

  it('renders supported text files', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Equipment P-101')));
    render(withQueries(<CogniteFileViewer source={{ type: 'url', url: 'https://files.test/file.txt' }} />));
    expect(await screen.findByText('Equipment P-101')).toBeInTheDocument();
  });

  it('renders images and surfaces image decode failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['image']))));
    const { container } = render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/PID.png' }} renderError={(error: Error) => <p role="alert">{error.message}</p>} />
    ));
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const image = container.querySelector('img');
    if (!image) throw new Error('Missing image');
    fireEvent.error(image);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to display image');
  });

  it('describes the displayed image with the given alternative text', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['image']))));
    const { container } = render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/PID.png' }} alt="P&ID 21-100" />
    ));
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const measuringImage = container.querySelector('img');
    if (!measuringImage) throw new Error('Missing image');
    Object.defineProperty(measuringImage, 'naturalWidth', { value: 400 });
    Object.defineProperty(measuringImage, 'naturalHeight', { value: 300 });
    fireEvent.load(measuringImage);
    expect(await screen.findByAltText('P&ID 21-100')).toBeInTheDocument();
  });

  it('still shows an image that reports no size, such as an SVG without width and height', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['<svg/>']))));
    const { container } = render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/PID.svg' }} alt="Unsized drawing" />
    ));
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    const measuringImage = container.querySelector('img');
    if (!measuringImage) throw new Error('Missing image');
    Object.defineProperty(measuringImage, 'naturalWidth', { value: 0 });
    Object.defineProperty(measuringImage, 'naturalHeight', { value: 0 });
    fireEvent.load(measuringImage);
    const shown = await screen.findByAltText('Unsized drawing');
    expect(shown.style.width).not.toMatch(/NaN|^0px$/);
  });

  it('notes when a text file was cut because it is large', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('a'.repeat(TEXT_PREVIEW_MAX_CHARS + 1))));
    render(withQueries(<CogniteFileViewer source={{ type: 'url', url: 'https://files.test/big.txt' }} />));
    expect(await screen.findByRole('note')).toHaveTextContent('only the first part is shown');
  });

  it('shows text download failures through the custom error renderer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })));
    render(withQueries(
      <CogniteFileViewer source={{ type: 'url', url: 'https://files.test/file.txt' }} renderError={(error: Error) => <p role="alert">{error.message}</p>} />
    ));
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 403');
  });
});

function withQueries(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
