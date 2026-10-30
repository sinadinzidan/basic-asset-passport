import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FilesCard } from '../FilesCard';

const base = { title: 'Files', description: 'Linked files', emptyTitle: 'No files', emptyDescription: 'Nothing is linked yet.' };

describe('FilesCard', () => {
  it('lists the files, opens one on click and shows the footnote under them', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    render(<FilesCard {...base} footnote="Showing the first 100 files." files={[{ key: 'a', name: 'Datasheet.pdf', meta: 'Rev B · 2026-01-02', onPreview }]} />);
    expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Datasheet\.pdf/ }));
    expect(onPreview).toHaveBeenCalledOnce();
    expect(screen.getByRole('note')).toHaveTextContent('Showing the first 100 files.');
  });

  it('keeps its header and shows the empty state inside the card when there are no files', () => {
    render(<FilesCard {...base} footnote="Not shown without files." files={[]} />);
    expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No files');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('shows a loading or error notice instead of the empty state', () => {
    render(<FilesCard {...base} files={[]} notice={<p role="alert">Failed to load files</p>} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load files');
    expect(screen.queryByText('No files')).not.toBeInTheDocument();
  });
});
