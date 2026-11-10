import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentOrigin } from '../../../../enums/documentOrigin';
import { DocumentUploadStatus } from '../../../../enums/documentUploadStatus';
import {
  UseAssetDocumentsContext,
  type UseAssetDocumentsContextType,
} from '../../../../hooks/assets/documents/useAssetDocuments';
import {
  UseAssetLinkedFilesContext,
  type UseAssetLinkedFilesContextType,
} from '../../../../hooks/assets/documents/useAssetLinkedFiles';
import {
  UseDeleteAssetDocumentContext,
  type UseDeleteAssetDocumentContextType,
} from '../../../../hooks/assets/documents/useDeleteAssetDocument';
import {
  DocumentPreviewContext,
  type RenderDocumentPreview,
} from '../../../../hooks/assets/documents/useDocumentPreview';
import {
  UseUploadingDocumentNamesContext,
  type UseUploadingDocumentNamesContextType,
} from '../../../../hooks/assets/documents/useUploadingDocumentNames';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeAssetDocument } from '../../../../mocks/documents';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import { AssetDocumentList } from '../AssetDocumentList';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(AssetDocumentList.name, () => {
  let listContext: UseAssetDocumentsContextType;
  let linkedContext: UseAssetLinkedFilesContextType;
  let deleteContext: UseDeleteAssetDocumentContextType;
  let uploadingContext: UseUploadingDocumentNamesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    const client = makeMockClient();
    listContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetDocuments: vi.fn(() => Promise.resolve([makeAssetDocument()])),
    };
    linkedContext = {
      useAssetDataClient: vi.fn(() => client),
      listAssetLinkedFiles: vi.fn(() => Promise.resolve([])),
    };
    deleteContext = {
      useAssetDataClient: vi.fn(() => client),
      deleteAssetDocument: vi.fn(() => Promise.resolve()),
    };
    uploadingContext = { useAssetDataClient: vi.fn(() => client) };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetDocumentsContext.Provider value={listContext}>
        <UseAssetLinkedFilesContext.Provider value={linkedContext}>
          <DocumentPreviewContext.Provider value={renderPreviewStub}>
            <UseDeleteAssetDocumentContext.Provider value={deleteContext}>
              <UseUploadingDocumentNamesContext.Provider value={uploadingContext}>
                <QueryWrapper>{children}</QueryWrapper>
              </UseUploadingDocumentNamesContext.Provider>
            </UseDeleteAssetDocumentContext.Provider>
          </DocumentPreviewContext.Provider>
        </UseAssetLinkedFilesContext.Provider>
      </UseAssetDocumentsContext.Provider>
    );
  });

  function renderList() {
    return render(<AssetDocumentList assetIdentifier={assetIdentifier} />, {
      wrapper,
    });
  }

  it('shows a loading status while the documents load', () => {
    vi.mocked(listContext.listAssetDocuments).mockReturnValue(
      new Promise(() => {}),
    );

    renderList();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading documents...',
    );
  });

  it('lists each document with its type and upload date', async () => {
    renderList();

    expect(await screen.findByText('Pump manual.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('Uploaded 5 Nov 2026')).toBeInTheDocument();
  });

  it('shows an empty state when the asset has no documents', async () => {
    vi.mocked(listContext.listAssetDocuments).mockResolvedValue([]);

    renderList();

    expect(await screen.findByText('No documents yet')).toBeInTheDocument();
  });

  it('shows a readable error with a retry when loading fails', async () => {
    const user = userEvent.setup();
    vi.mocked(listContext.listAssetDocuments).mockRejectedValueOnce(
      new Error('no access'),
    );

    renderList();

    expect(
      await screen.findByText('Documents could not be loaded'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Pump manual.pdf')).toBeInTheDocument();
  });

  it('shows a document CDF is still processing as processing, not incomplete', async () => {
    vi.mocked(listContext.listAssetDocuments).mockResolvedValue([
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.PROCESSING,
        uploadedTime: null,
      }),
    ]);

    renderList();

    expect(await screen.findByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Upload incomplete')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Pump manual.pdf' }),
    ).toBeDisabled();
  });

  it('flags a document whose upload did not finish and cannot be viewed', async () => {
    vi.mocked(listContext.listAssetDocuments).mockResolvedValue([
      makeAssetDocument({
        isUploaded: false,
        uploadStatus: DocumentUploadStatus.INCOMPLETE,
        uploadedTime: null,
      }),
    ]);

    renderList();

    expect(await screen.findByText('Upload incomplete')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.queryByText(/^Uploaded /)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Pump manual.pdf' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Delete Pump manual.pdf' }),
    ).toBeEnabled();
  });

  describe('files that already exist for the asset', () => {
    const existingFile = () =>
      makeAssetDocument({
        space: 'rmdm-data',
        externalId: 'file-1',
        name: 'P&ID.pdf',
        origin: DocumentOrigin.RMDM,
      });

    it('lists them after the documents uploaded here, marked as existing files', async () => {
      vi.mocked(linkedContext.listAssetLinkedFiles).mockResolvedValue([
        existingFile(),
      ]);

      renderList();

      expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
      expect(screen.getByText('Existing file')).toBeInTheDocument();
      const headings = screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent);
      expect(headings).toEqual(['Pump manual.pdf', 'P&ID.pdf']);
    });

    it('can be viewed but not deleted', async () => {
      vi.mocked(linkedContext.listAssetLinkedFiles).mockResolvedValue([
        existingFile(),
      ]);

      renderList();

      expect(
        await screen.findByRole('button', { name: 'View P&ID.pdf' }),
      ).toBeEnabled();
      expect(
        screen.queryByRole('button', { name: 'Delete P&ID.pdf' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Delete Pump manual.pdf' }),
      ).toBeInTheDocument();
    });

    it('keep the loading status up while they load and nothing else is there to show', async () => {
      vi.mocked(listContext.listAssetDocuments).mockResolvedValue([]);
      vi.mocked(linkedContext.listAssetLinkedFiles).mockReturnValue(
        new Promise(() => {}),
      );

      renderList();

      await vi.waitFor(() =>
        expect(listContext.listAssetDocuments).toHaveBeenCalled(),
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        'Loading documents...',
      );
      expect(screen.queryByText('No documents yet')).not.toBeInTheDocument();
    });

    it('are listed when nothing was uploaded here', async () => {
      vi.mocked(listContext.listAssetDocuments).mockResolvedValue([]);
      vi.mocked(linkedContext.listAssetLinkedFiles).mockResolvedValue([
        existingFile(),
      ]);

      renderList();

      expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
      expect(screen.queryByText('No documents yet')).not.toBeInTheDocument();
    });

    it('keep the uploaded documents visible when they cannot be loaded, with a retry', async () => {
      const user = userEvent.setup();
      vi.mocked(linkedContext.listAssetLinkedFiles)
        .mockRejectedValueOnce(new Error('no access'))
        .mockResolvedValue([existingFile()]);

      renderList();

      expect(
        await screen.findByText('Existing files could not be loaded'),
      ).toBeInTheDocument();
      expect(screen.getByText('Pump manual.pdf')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Retry' }));
      expect(await screen.findByText('P&ID.pdf')).toBeInTheDocument();
    });

    it('do not turn the empty state into "No documents yet" when they failed to load', async () => {
      vi.mocked(listContext.listAssetDocuments).mockResolvedValue([]);
      vi.mocked(linkedContext.listAssetLinkedFiles).mockRejectedValue(
        new Error('no access'),
      );

      renderList();

      expect(
        await screen.findByText('Existing files could not be loaded'),
      ).toBeInTheDocument();
      expect(screen.queryByText('No documents yet')).not.toBeInTheDocument();
    });
  });

  it('previews the document in a dialog when it is viewed', async () => {
    // Arrange
    const user = userEvent.setup();
    renderList();

    // Act
    await user.click(
      await screen.findByRole('button', { name: 'View Pump manual.pdf' }),
    );

    // Assert
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Pump manual.pdf' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Previewing doc-1')).toBeInTheDocument();
  });

  it('closes the preview and keeps the document', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(
      await screen.findByRole('button', { name: 'View Pump manual.pdf' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Close',
      }),
    );

    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Pump manual.pdf')).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and deletes only once confirmed', async () => {
    // Arrange
    const user = userEvent.setup();
    renderList();

    // Act
    await user.click(
      await screen.findByRole('button', { name: 'Delete Pump manual.pdf' }),
    );

    // Assert
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Delete document?'),
    ).toBeInTheDocument();
    expect(deleteContext.deleteAssetDocument).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole('button', { name: 'Delete document' }),
    );

    await vi.waitFor(() =>
      expect(deleteContext.deleteAssetDocument).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          space: 'sp-asset-passport-data',
          externalId: 'doc-1',
        }),
      ),
    );
  });

  it('keeps the dialog open and locked until the delete is over', async () => {
    const user = userEvent.setup();
    let finishDelete: () => void = () => {};
    vi.mocked(deleteContext.deleteAssetDocument).mockReturnValue(
      new Promise<void>((resolve) => {
        finishDelete = resolve;
      }),
    );
    renderList();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Pump manual.pdf' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete document' }),
    );

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(
      within(dialog).getByRole('button', { name: 'Deleting...' }),
    ).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();

    finishDelete();

    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('keeps the document when the delete is cancelled', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Pump manual.pdf' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Cancel',
      }),
    );

    expect(deleteContext.deleteAssetDocument).not.toHaveBeenCalled();
    expect(screen.getByText('Pump manual.pdf')).toBeInTheDocument();
  });

  it('explains why a document could not be deleted', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteContext.deleteAssetDocument).mockRejectedValue(
      new Error('Forbidden'),
    );
    renderList();

    await user.click(
      await screen.findByRole('button', { name: 'Delete Pump manual.pdf' }),
    );
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Delete document',
      }),
    );

    expect(
      await screen.findByText('The document could not be deleted'),
    ).toBeInTheDocument();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByText('Pump manual.pdf')).toBeInTheDocument();
  });
});

const renderPreviewStub: RenderDocumentPreview = (document) => (
  <p>Previewing {document.externalId}</p>
);
