import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DisplayPanel } from '../DisplayPanel';

describe(DisplayPanel.name, () => {
  it('shows what is on and what is off', () => {
    renderPanel({ shouldShowGridlines: true, shouldShowMinMax: false, isStacked: true });

    expect(screen.getByRole('switch', { name: 'Gridlines' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Minimum and maximum' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Stack the series in lanes' })).toBeChecked();
  });

  it('says what the less obvious switches do', () => {
    renderPanel();

    expect(screen.getByRole('switch', { name: 'Minimum and maximum' })).toHaveAccessibleDescription(
      'Marks the lowest and highest reading of each series in the visible range.',
    );
    expect(
      screen.getByRole('switch', { name: 'Stack the series in lanes' }),
    ).toHaveAccessibleDescription(
      'Gives each series its own lane and axis instead of overlaying them.',
    );
  });

  it('turns the gridlines off', async () => {
    const onGridlinesChange = vi.fn();
    renderPanel({ shouldShowGridlines: true, onGridlinesChange });

    await userEvent.click(screen.getByRole('switch', { name: 'Gridlines' }));

    expect(onGridlinesChange).toHaveBeenCalledWith(false);
  });

  it('turns the minimum and maximum on', async () => {
    const onMinMaxChange = vi.fn();
    renderPanel({ shouldShowMinMax: false, onMinMaxChange });

    await userEvent.click(screen.getByRole('switch', { name: 'Minimum and maximum' }));

    expect(onMinMaxChange).toHaveBeenCalledWith(true);
  });

  it('stacks the series', async () => {
    const onStackedChange = vi.fn();
    renderPanel({ isStacked: false, onStackedChange });

    await userEvent.click(screen.getByRole('switch', { name: 'Stack the series in lanes' }));

    expect(onStackedChange).toHaveBeenCalledWith(true);
  });
});

function renderPanel(overrides: Partial<Parameters<typeof DisplayPanel>[0]> = {}) {
  return render(
    <DisplayPanel
      shouldShowGridlines
      shouldShowMinMax={false}
      isStacked={false}
      onGridlinesChange={vi.fn()}
      onMinMaxChange={vi.fn()}
      onStackedChange={vi.fn()}
      {...overrides}
    />,
  );
}
