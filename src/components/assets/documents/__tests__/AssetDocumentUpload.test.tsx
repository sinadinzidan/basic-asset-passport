import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import {
  UseUploadAssetDocumentsContext,
  type UseUploadAssetDocumentsContextType,
} from '../../../../hooks/assets/documents/useUploadAssetDocuments';
import type { ShowSuccessToast } from '../../../../hooks/general/useSuccessToast';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeQueryClientWrapper } from '../../../../mocks/queryClientWrapper';
import { AssetDocumentUpload } from '../AssetDocumentUpload';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(AssetDocumentUpload.name, () => {
  let mockContext: UseUploadAssetDocumentsContextType;
  let showSuccessToast: Mock<ShowSuccessToast>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    showSuccessToast = vi.fn();
    mockContext = {
      useAssetDataClient: vi.fn(() => makeMockClient()),
      useDocumentFileClient: vi.fn(() => ({
        requestUploadUrl: vi.fn(),
        uploadContent: vi.fn(),
      })),
      useSuccessToast: vi.fn(() => showSuccessToast),
      uploadAssetDocument: vi.fn(() => Promise.resolve()),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseUploadAssetDocumentsContext.Provider value={mockContext}>
        <QueryWrapper>{children}</QueryWrapper>
      </UseUploadAssetDocumentsContext.Provider>
    );
  });

  function renderUpload() {
    return render(<AssetDocumentUpload assetIdentifier={assetIdentifier} />, {
      wrapper,
    });
  }

  function makeFile(name: string): File {
    return new File(['content'], name, { type: 'application/pdf' });
  }

  it('tells the user what can be uploaded', () => {
    renderUpload();

    expect(
      screen.getByText('Choose one or more files, up to 50 MB each.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upload documents' }),
    ).toBeEnabled();
  });

  it('uploads every chosen file for the asset', async () => {
    // Arrange
    const user = userEvent.setup();
    const files = [makeFile('a.pdf'), makeFile('b.pdf')];
    renderUpload();

    // Act
    await user.upload(
      screen.getByLabelText('Choose documents to upload'),
      files,
    );

    // Assert
    await vi.waitFor(() =>
      expect(showSuccessToast).toHaveBeenCalledWith('2 documents uploaded.'),
    );
    expect(mockContext.uploadAssetDocument).toHaveBeenCalledTimes(2);
    expect(mockContext.uploadAssetDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      assetIdentifier,
      files[0],
    );
  });

  it('confirms a single upload', async () => {
    const user = userEvent.setup();
    renderUpload();

    await user.upload(
      screen.getByLabelText('Choose documents to upload'),
      makeFile('a.pdf'),
    );

    await vi.waitFor(() =>
      expect(showSuccessToast).toHaveBeenCalledWith('1 document uploaded.'),
    );
    expect(screen.queryByText('1 document uploaded.')).not.toBeInTheDocument();
  });

  it('shows which files failed and why, and still reports the others', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(mockContext.uploadAssetDocument).mockImplementation(
      (_client, _files, _asset, file) =>
        file.name === 'bad.pdf'
          ? Promise.reject(new Error('Uploading the file failed (403).'))
          : Promise.resolve(),
    );
    renderUpload();

    // Act
    await user.upload(screen.getByLabelText('Choose documents to upload'), [
      makeFile('bad.pdf'),
      makeFile('good.pdf'),
    ]);

    // Assert
    expect(
      await screen.findByText('Some documents could not be uploaded'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('bad.pdf: Uploading the file failed (403).'),
    ).toBeInTheDocument();
    expect(showSuccessToast).toHaveBeenCalledWith('1 document uploaded.');
  });

  it('disables the button while uploading', async () => {
    const user = userEvent.setup();
    vi.mocked(mockContext.uploadAssetDocument).mockReturnValue(
      new Promise(() => {}),
    );
    renderUpload();

    await user.upload(
      screen.getByLabelText('Choose documents to upload'),
      makeFile('a.pdf'),
    );

    expect(
      await screen.findByRole('button', { name: 'Uploading...' }),
    ).toBeDisabled();
  });
});
