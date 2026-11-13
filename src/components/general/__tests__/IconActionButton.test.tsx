import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconActionVariant } from '../../../enums/iconActionVariant';
import { IconActionButton } from '../IconActionButton';

describe(IconActionButton.name, () => {
  it('is named by its label, since it shows only an icon', () => {
    renderButton();

    expect(screen.getByRole('button', { name: 'View manual' })).toBeVisible();
  });

  it('runs the action when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderButton({ onClick });

    await user.click(screen.getByRole('button', { name: 'View manual' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not run the action while disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderButton({ onClick, isDisabled: true });

    const button = screen.getByRole('button', { name: 'View manual' });

    await user.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the label as a tooltip when the button is focused', async () => {
    const user = userEvent.setup();

    renderButton();

    await user.tab();

    expect(await screen.findByText('View manual')).toBeInTheDocument();
  });

  it('takes a class for where it is placed', () => {
    renderButton({ className: 'self-end' });

    expect(screen.getByRole('button', { name: 'View manual' })).toHaveClass(
      'self-end',
      'hud-button',
    );
  });

  it('uses the red pill for a destructive action', () => {
    renderButton({ variant: IconActionVariant.DESTRUCTIVE });

    expect(screen.getByRole('button', { name: 'View manual' })).toHaveClass(
      'bg-destructive-background',
    );
  });
});

function renderButton(overrides: Partial<Parameters<typeof IconActionButton>[0]> = {}) {
  render(
    <IconActionButton
      icon={<svg aria-hidden />}
      label="View manual"
      onClick={vi.fn()}
      {...overrides}
    />,
  );
}
