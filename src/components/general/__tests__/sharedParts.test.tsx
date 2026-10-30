import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AssetName } from '../../assets/AssetName';
import { FileRow } from '../FileRow';
import { InitialsAvatar } from '../InitialsAvatar';
import { LoadingNotice } from '../LoadingNotice';
import { RetryAlert } from '../RetryAlert';

describe('LoadingNotice', () => {
  it('announces what is loading with one ellipsis style', () => {
    render(<LoadingNotice label="Loading files" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading files…');
  });
});

describe('RetryAlert', () => {
  it('shows the message as an alert with Retry and any extra actions', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<RetryAlert message="Failed to load files: Forbidden" onRetry={onRetry}><button type="button">Go to first page</button></RetryAlert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load files: Forbidden');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Go to first page' })).toBeInTheDocument();
  });

  it('disables Retry while a retry is running and omits it when there is nothing to retry', () => {
    const { rerender } = render(<RetryAlert message="Failed" onRetry={vi.fn()} isBusy />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    rerender(<RetryAlert message="Failed to connect to Fusion host." />);
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });
});

describe('FileRow', () => {
  it('is one button named by its visible text, with the details and optional description', async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    render(<FileRow name="Plant P&ID" meta="DOC-A · Rev C · 2026-02-10" description="Rev C drawing" onPreview={onPreview} />);
    // The name comes from the visible text, so it contains everything a sighted user reads (WCAG 2.5.3, Label in Name).
    const button = screen.getByRole('button', { name: /^Plant P&ID.*DOC-A · Rev C · 2026-02-10.*Preview$/ });
    await user.click(button);
    expect(onPreview).toHaveBeenCalledOnce();
    expect(screen.getByText('DOC-A · Rev C · 2026-02-10')).toBeInTheDocument();
    expect(screen.getByText('Rev C drawing')).toBeInTheDocument();
  });

  it('does not show a description that only repeats the name', () => {
    render(<FileRow name="PH-ME-P-0003-001.pdf" meta="Rev — · 2026-06-12" description="ph-me-p-0003-001.pdf" onPreview={vi.fn()} />);
    expect(screen.getAllByText(/PH-ME-P-0003-001\.pdf/i)).toHaveLength(1);
  });
});

describe('InitialsAvatar', () => {
  it('shows initials and is hidden from assistive tech', () => {
    const { container } = render(<InitialsAvatar name="Feed pump" colorKey="P-1" />);
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('FP');
  });
});

describe('AssetName', () => {
  it('opens the asset without triggering the row around it', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onRowClick = vi.fn();
    render(<div onClick={onRowClick} role="presentation"><AssetName name="Feed pump" onOpen={onOpen} /></div>);
    await user.click(screen.getByRole('button', { name: 'Open Feed pump' }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('is plain text when the asset cannot be opened', () => {
    render(<AssetName name="Feed pump" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Feed pump')).toBeInTheDocument();
  });
});
