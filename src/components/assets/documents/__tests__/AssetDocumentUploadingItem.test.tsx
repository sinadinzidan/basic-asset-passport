import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetDocumentUploadingItem } from '../AssetDocumentUploadingItem';

describe(AssetDocumentUploadingItem.name, () => {
  it('shows the name of the file with an uploading status', () => {
    render(<AssetDocumentUploadingItem name="Pump manual.pdf" />);

    expect(screen.getByRole('heading', { name: 'Pump manual.pdf' })).toBeInTheDocument();
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('names the card after the upload for assistive technology', () => {
    render(<AssetDocumentUploadingItem name="Pump manual.pdf" />);

    expect(screen.getByRole('article', { name: 'Uploading Pump manual.pdf' })).toBeInTheDocument();
  });

  it('offers no actions while the file uploads', () => {
    render(<AssetDocumentUploadingItem name="Pump manual.pdf" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
