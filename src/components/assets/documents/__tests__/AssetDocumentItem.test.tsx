import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeAssetDocument } from '../../../../__mocks__/documents';
import { DocumentOrigin } from '../../../../enums/documentOrigin';
import { DocumentUploadStatus } from '../../../../enums/documentUploadStatus';
import {
  DocumentPreviewRendererContext,
  type RenderDocumentPreview,
} from '../../../../hooks/assets/documents/useDocumentPreviewRenderer';
import type { AssetDocument } from '../../../../types/document';
import { AssetDocumentItem } from '../AssetDocumentItem';

type ItemOptions = {
  document?: AssetDocument;
  isDeleting?: boolean;
};

const renderPreviewStub: RenderDocumentPreview = (document) => (
  <p>Previewing {document.externalId}</p>
);

describe(AssetDocumentItem.name, () => {
  let onDelete: (document: AssetDocument) => Promise<void>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    onDelete = vi.fn(() => Promise.resolve());
    wrapper = ({ children }) => (
      <DocumentPreviewRendererContext.Provider value={renderPreviewStub}>
        {children}
      </DocumentPreviewRendererContext.Provider>
    );
  });

  function renderItem({ document = makeAssetDocument(), isDeleting = false }: ItemOptions = {}) {
    return render(
      <AssetDocumentItem document={document} isDeleting={isDeleting} onDelete={onDelete} />,
      { wrapper },
    );
  }

  it('shows the name, type and upload date of the document', () => {
    renderItem();

    expect(screen.getByRole('heading', { name: 'Pump manual.pdf' })).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Uploaded 5 Nov 2026')).toBeInTheDocument();
  });

  it('calls a file of an unknown type a file', () => {
    renderItem({ document: makeAssetDocument({ mimeType: null }) });

    expect(screen.getByText('File')).toBeInTheDocument();
  });

  it('says a document CDF has not marked uploaded yet is processing, and cannot be viewed', () => {
    renderItem({
      document: makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
        uploadedTime: null,
      }),
    });

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Upload incomplete')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Pump manual.pdf' })).toBeDisabled();
  });

  it('flags a document whose content never arrived', () => {
    renderItem({
      document: makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.INCOMPLETE,
        uploadedTime: null,
      }),
    });

    expect(screen.getByText('Upload incomplete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Pump manual.pdf' })).toBeDisabled();
  });

  it('marks a file that already existed and offers no delete for it', () => {
    renderItem({ document: makeAssetDocument({ origin: DocumentOrigin.RMDM }) });

    expect(screen.getByText('Existing file')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Pump manual.pdf' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Delete Pump manual.pdf' }),
    ).not.toBeInTheDocument();
  });

  it('does not mark a document uploaded here as an existing file', () => {
    renderItem();

    expect(screen.queryByText('Existing file')).not.toBeInTheDocument();
  });

  it('previews the document in a dialog titled with its name', async () => {
    const user = userEvent.setup();

    renderItem();

    await user.click(screen.getByRole('button', { name: 'View Pump manual.pdf' }));

    const dialog = await screen.findByRole('dialog', { name: 'Pump manual.pdf' });

    expect(within(dialog).getByText('Previewing doc-1')).toBeInTheDocument();
  });

  it('locks delete while the document is being deleted', () => {
    renderItem({ isDeleting: true });

    expect(screen.getByRole('button', { name: 'Delete Pump manual.pdf' })).toBeDisabled();
  });

  it('asks before deleting, then hands the document to its list', async () => {
    const user = userEvent.setup();
    const document = makeAssetDocument();

    renderItem({ document });
    await user.click(screen.getByRole('button', { name: 'Delete Pump manual.pdf' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete document?' });

    expect(dialog).toHaveTextContent(
      'Pump manual.pdf and its file will be deleted permanently. This cannot be undone.',
    );
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete document' }));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith(document);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the document when the delete is cancelled', async () => {
    const user = userEvent.setup();

    renderItem();
    await user.click(screen.getByRole('button', { name: 'Delete Pump manual.pdf' }));

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
