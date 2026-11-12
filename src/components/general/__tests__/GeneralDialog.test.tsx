import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DialogSize } from '../../../enums/dialogSize';
import { GeneralDialog } from '../GeneralDialog';

describe(GeneralDialog.name, () => {
  it('shows the title in a header, the content in a body and the actions in a footer', () => {
    renderDialog();

    expect(
      screen.getByText('Delete document?').closest('[data-slot="dialog-header"]'),
    ).not.toBeNull();
    expect(
      screen.getByText('This cannot be undone.').closest('[data-slot="dialog-body"]'),
    ).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'Confirm' }).closest('[data-slot="dialog-footer"]'),
    ).not.toBeNull();
  });

  it('separates the header from the body and the body from the footer', () => {
    renderDialog();

    expect(screen.getByText('Delete document?').closest('[data-slot="dialog-header"]')).toHaveClass(
      'border-b',
    );
    expect(
      screen.getByText('This cannot be undone.').closest('[data-slot="dialog-body"]'),
    ).toHaveClass('border-b');
  });

  it('gives the close button the same pill look as the other buttons', () => {
    renderDialog();

    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('hud-button');
  });

  it('stands a vent of slanted bars in its cut-away, like a KPI card, hidden from assistive technology', () => {
    renderDialog();

    const vent = screen.getByRole('dialog').querySelector('.hud-vent');

    expect(vent).toHaveAttribute('aria-hidden', 'true');
    expect(vent?.parentElement).toBe(screen.getByRole('dialog'));
  });

  it('draws its outline on a frame inside the dialog, so the vent beside it is not clipped', () => {
    renderDialog();

    const body = screen.getByText('This cannot be undone.').closest('.hud-dialog__body');

    expect(body?.parentElement).toHaveClass('hud-dialog__frame');
    expect(body?.parentElement?.parentElement).toBe(screen.getByRole('dialog'));
  });

  it('asks to close when the close button is pressed', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it('is the normal width unless a larger size is asked for', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).not.toHaveClass('hud-dialog--large');
  });

  it('can be made larger for content that needs room', () => {
    render(
      <GeneralDialog isOpen onOpenChange={vi.fn()} size={DialogSize.LARGE} title="Preview">
        content
      </GeneralDialog>,
    );

    expect(screen.getByRole('dialog')).toHaveClass('hud-dialog--large');
  });

  it('leaves out the footer and its divider when there are no actions', () => {
    render(
      <GeneralDialog isOpen onOpenChange={vi.fn()} title="Preview">
        content
      </GeneralDialog>,
    );

    const body = screen.getByText('content').closest('[data-slot="dialog-body"]');
    expect(body).not.toHaveClass('border-b');
    expect(screen.getByRole('dialog').querySelector('[data-slot="dialog-footer"]')).toBeNull();
  });

  it('renders nothing while closed', () => {
    render(
      <GeneralDialog isOpen={false} onOpenChange={vi.fn()} title="Hidden" footer={null}>
        content
      </GeneralDialog>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

function renderDialog(onOpenChange: (open: boolean) => void = vi.fn()) {
  render(
    <GeneralDialog
      isOpen
      onOpenChange={onOpenChange}
      title="Delete document?"
      footer={<button type="button">Confirm</button>}
    >
      This cannot be undone.
    </GeneralDialog>,
  );
}
