import { CogniteClient } from '@cognite/sdk';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { CogniteFileViewerProps } from '../../../cognite-file-viewer/types';
import { FilePreviewDialog } from '../FilePreviewDialog';

describe('FilePreviewDialog', () => {
  it('passes composite instance identity to the viewer and exposes PDF and zoom controls', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPreview(onClose);

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Plant P&ID');
    expect(screen.getByText('files / PID-1')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Zoom controls' })).toBeInTheDocument();
    expect(screen.getByText('Read-only · CDF file')).toBeInTheDocument();
    expect(screen.getByText('instanceId: files/PID-1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load PDF' }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('125%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(screen.getByText('100%')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close file viewer' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows actionable loading, unsupported and failure states', async () => {
    const user = userEvent.setup();
    renderPreview(vi.fn());
    await user.click(screen.getByRole('button', { name: 'Show loading' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading file');
    await user.click(screen.getByRole('button', { name: 'Show unsupported' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Preview is not available');
    await user.click(screen.getByRole('button', { name: 'Show error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Access denied');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderPreview(onClose);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('resets page and zoom when a different file opens', async () => {
    const user = userEvent.setup();
    const client = new CogniteClient({ appId: 'test', project: 'test', oidcTokenProvider: async () => 'test' });
    const { rerender } = render(
      <FilePreviewDialog key="first" file={{ space: 'one', externalId: 'PID', name: 'First P&ID' }} client={client} onClose={vi.fn()} Viewer={TestViewer} />
    );
    await user.click(screen.getByRole('button', { name: 'Load PDF' }));
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    rerender(
      <FilePreviewDialog key="second" file={{ space: 'two', externalId: 'PID', name: 'Second P&ID' }} client={client} onClose={vi.fn()} Viewer={TestViewer} />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('instanceId: two/PID')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load PDF' }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});

function renderPreview(onClose: () => void): void {
  const client = new CogniteClient({ appId: 'test', project: 'test', getToken: async () => 'test' });
  render(
    <FilePreviewDialog
      file={{ space: 'files', externalId: 'PID-1', name: 'Plant P&ID' }}
      client={client}
      onClose={onClose}
      Viewer={TestViewer}
    />
  );
}

const TestViewer: ComponentType<CogniteFileViewerProps> = (props: CogniteFileViewerProps) => {
  const [status, setStatus] = useState('ready');
  const { source } = props;
  return (
    <div>
      {source.type === 'instanceId' && <p>instanceId: {source.space}/{source.externalId}</p>}
      <button onClick={() => props.onDocumentLoad?.({ numPages: 3 })}>Load PDF</button>
      <button onClick={() => setStatus('loading')}>Show loading</button>
      <button onClick={() => setStatus('unsupported')}>Show unsupported</button>
      <button onClick={() => setStatus('error')}>Show error</button>
      {status === 'loading' && props.renderLoading?.()}
      {status === 'unsupported' && props.renderUnsupported?.('application/octet-stream')}
      {status === 'error' && props.renderError?.(new Error('Access denied'))}
    </div>
  );
};
