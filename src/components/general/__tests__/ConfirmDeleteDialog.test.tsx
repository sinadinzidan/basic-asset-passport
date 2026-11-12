import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';

describe(ConfirmDeleteDialog.name, () => {
  it('asks the question with what will be lost and the delete action', () => {
    renderDialog();

    expect(screen.getByText('Delete note?')).toBeVisible();
    expect(screen.getByText('This cannot be undone.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Delete note' })).toBeEnabled();
  });

  it('shows nothing while it is closed', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without deleting when the delete is cancelled', async () => {
    const user = userEvent.setup();
    const { onConfirm, onClose } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('deletes, then closes once the delete is over', async () => {
    const user = userEvent.setup();
    const { onConfirm, onClose } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Delete note' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('stays open with its actions disabled while the delete runs', async () => {
    const user = userEvent.setup();
    let finishDelete: () => void = () => {};
    const { onClose } = renderDialog({
      onConfirm: vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finishDelete = resolve;
          }),
      ),
    });

    await user.click(screen.getByRole('button', { name: 'Delete note' }));

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).not.toHaveBeenCalled();

    finishDelete();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

type DialogOverrides = {
  isOpen?: boolean;
  onConfirm?: () => Promise<void>;
};

function renderDialog({
  isOpen = true,
  onConfirm = vi.fn(() => Promise.resolve()),
}: DialogOverrides = {}) {
  const onClose = vi.fn();

  render(
    <ConfirmDeleteDialog
      isOpen={isOpen}
      title="Delete note?"
      confirmLabel="Delete note"
      onConfirm={onConfirm}
      onClose={onClose}
    >
      This cannot be undone.
    </ConfirmDeleteDialog>,
  );

  return { onConfirm, onClose };
}
