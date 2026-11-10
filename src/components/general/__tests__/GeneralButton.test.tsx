import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { GeneralButton } from '../GeneralButton';

describe('GeneralButton', () => {
  it('renders its label as a button', () => {
    render(<GeneralButton>Save</GeneralButton>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('always takes the HUD pill look', () => {
    render(<GeneralButton>Save</GeneralButton>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
      'hud-button',
    );
  });

  it('keeps the HUD look when a class is added', () => {
    render(<GeneralButton className="w-full">Save</GeneralButton>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('hud-button');
    expect(button).toHaveClass('w-full');
  });

  it('reports the default variant and size for styling', () => {
    render(<GeneralButton>Save</GeneralButton>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'default');
  });

  it('reports the variant and size it was given for styling', () => {
    render(
      <GeneralButton size="icon-sm" variant="destructive">
        Delete
      </GeneralButton>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('data-variant', 'destructive');
    expect(button).toHaveAttribute('data-size', 'icon-sm');
  });

  it('forwards its ref to the button element', () => {
    const ref = createRef<HTMLElement>();
    render(<GeneralButton ref={ref}>Save</GeneralButton>);

    expect(ref.current).toBe(screen.getByRole('button', { name: 'Save' }));
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<GeneralButton onClick={onClick}>Save</GeneralButton>);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(
      <GeneralButton disabled onClick={onClick}>
        Save
      </GeneralButton>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
