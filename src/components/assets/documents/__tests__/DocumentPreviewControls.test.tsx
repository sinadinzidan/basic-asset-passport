import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  PREVIEW_DEFAULT_ZOOM,
  PREVIEW_MAX_ZOOM,
  PREVIEW_MIN_ZOOM,
  PREVIEW_ZOOM_STEP,
} from '../../../../constants/documents';
import { DocumentPreviewControls } from '../DocumentPreviewControls';

describe(DocumentPreviewControls.name, () => {
  it('shows the zoom as a percentage', () => {
    renderControls({ zoom: 1.5 });

    expect(screen.getByRole('button', { name: 'Reset zoom' })).toHaveTextContent('150%');
  });

  it('zooms in and out by one step and resets to the default', async () => {
    const onZoomChange = vi.fn();
    const zoom = PREVIEW_DEFAULT_ZOOM + PREVIEW_ZOOM_STEP;

    renderControls({ zoom, onZoomChange });

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset zoom' }));

    expect(onZoomChange.mock.calls).toEqual([
      [zoom + PREVIEW_ZOOM_STEP],
      [zoom - PREVIEW_ZOOM_STEP],
      [PREVIEW_DEFAULT_ZOOM],
    ]);
  });

  it('stops zooming at the limits', () => {
    const { rerender } = renderControls({ zoom: PREVIEW_MIN_ZOOM });

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled();

    rerender(
      <DocumentPreviewControls
        page={1}
        pageCount={1}
        zoom={PREVIEW_MAX_ZOOM}
        onPageChange={vi.fn()}
        onZoomChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
  });

  it('has no page controls for a single page', () => {
    renderControls({ pageCount: 1 });

    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });

  it('moves one page back and forward', async () => {
    const onPageChange = vi.fn();

    renderControls({ page: 2, pageCount: 3, onPageChange });

    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  });

  it('stops at the first and the last page', () => {
    const { rerender } = renderControls({ page: 1, pageCount: 2 });

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    rerender(
      <DocumentPreviewControls
        page={2}
        pageCount={2}
        zoom={1}
        onPageChange={vi.fn()}
        onZoomChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

function renderControls(overrides: Partial<Parameters<typeof DocumentPreviewControls>[0]> = {}) {
  return render(
    <DocumentPreviewControls
      page={1}
      pageCount={1}
      zoom={PREVIEW_DEFAULT_ZOOM}
      onPageChange={vi.fn()}
      onZoomChange={vi.fn()}
      {...overrides}
    />,
  );
}
