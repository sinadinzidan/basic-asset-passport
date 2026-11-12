import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SwitchField } from '../SwitchField';

describe(SwitchField.name, () => {
  it('is a switch named by the label, showing whether it is on', () => {
    const { rerender } = renderField({ checked: true });
    expect(screen.getByRole('switch', { name: 'Gridlines' })).toBeChecked();

    rerender(<SwitchField label="Gridlines" checked={false} onChange={vi.fn()} />);

    expect(screen.getByRole('switch', { name: 'Gridlines' })).not.toBeChecked();
  });

  it('reports the new state when it is switched', async () => {
    const onChange = vi.fn();
    renderField({ checked: false, onChange });

    await userEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is described by its description', () => {
    renderField({ description: 'Lines across the plot at each tick' });

    expect(screen.getByRole('switch')).toHaveAccessibleDescription(
      'Lines across the plot at each tick',
    );
  });

  it('has no description unless it is given one', () => {
    renderField();

    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby');
  });

  it('cannot be switched while disabled', async () => {
    const onChange = vi.fn();
    renderField({ isDisabled: true, onChange });

    await userEvent.click(screen.getByRole('switch'));

    expect(onChange).not.toHaveBeenCalled();
  });
});

function renderField(overrides: Partial<Parameters<typeof SwitchField>[0]> = {}) {
  return render(
    <SwitchField label="Gridlines" checked={false} onChange={vi.fn()} {...overrides} />,
  );
}
