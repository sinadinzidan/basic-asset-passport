import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { makeAssetDocument } from '../../../../__mocks__/documents';
import {
  DocumentPreviewContext,
  type RenderDocumentPreview,
} from '../../../../hooks/assets/documents/useDocumentPreview';
import { DocumentPreviewDialog } from '../DocumentPreviewDialog';

describe(DocumentPreviewDialog.name, () => {
  it('shows the document name as the title', () => {
    renderDialog({ isOpen: true });

    expect(screen.getByRole('heading', { name: 'Pump manual.pdf' })).toBeInTheDocument();
  });

  it('previews the document with the injected preview', () => {
    // Arrange
    const preview = vi.fn<RenderDocumentPreview>(() => null);

    // Act
    renderDialog({ isOpen: true, preview });

    // Assert
    expect(preview).toHaveBeenCalledWith(expect.objectContaining({ externalId: 'doc-1' }));
  });

  it('says so when no preview is available', () => {
    renderDialog({ isOpen: true, preview: null });

    expect(screen.getByText('Preview is not available here.')).toBeInTheDocument();
  });

  it('centres that message in a padded section of its own, under a decorative icon', () => {
    renderDialog({ isOpen: true, preview: null });

    const section = screen
      .getByText('Preview is not available here.')
      .closest('[data-slot="document-preview-unavailable"]');

    expect(section).toHaveClass('items-center', 'text-center', 'py-10');
    expect(section?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows nothing, and mounts no preview, while closed', () => {
    renderDialog({
      isOpen: false,
      preview: () => <p>Previewing the file</p>,
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Previewing the file')).not.toBeInTheDocument();
  });

  it('is the large dialog size so the file has room', () => {
    renderDialog({ isOpen: true });

    expect(screen.getByRole('dialog')).toHaveClass('hud-dialog--large');
  });
});

type RenderOptions = {
  isOpen: boolean;
  preview?: RenderDocumentPreview | null;
};

function renderDialog({ isOpen, preview = () => null }: RenderOptions) {
  render(
    <DocumentPreviewContext.Provider value={preview}>
      <DocumentPreviewDialog
        document={makeAssetDocument()}
        isOpen={isOpen}
        onOpenChange={vi.fn()}
      />
    </DocumentPreviewContext.Provider>,
  );
}
