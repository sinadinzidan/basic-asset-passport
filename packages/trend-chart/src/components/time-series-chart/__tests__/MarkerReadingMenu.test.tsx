import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MarkerReadingMenu } from '../MarkerReadingMenu';

describe(MarkerReadingMenu.name, () => {
  it('says that the marker reads the nearest reading', () => {
    render(<MarkerReadingMenu isInterpolated={false} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Marker readings' })).toHaveTextContent(
      'Nearest reading',
    );
  });

  it('says that the marker interpolates', () => {
    render(<MarkerReadingMenu isInterpolated onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Marker readings' })).toHaveTextContent(
      'Interpolated',
    );
  });

  it('offers both ways of reading, the current one checked', async () => {
    render(<MarkerReadingMenu isInterpolated={false} onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Marker readings' }));

    expect(screen.getByRole('menuitemradio', { name: 'Nearest reading' })).toBeChecked();
    expect(screen.getByRole('menuitemradio', { name: 'Interpolated' })).not.toBeChecked();
  });

  it('reports that the marker should interpolate', async () => {
    const onChange = vi.fn();
    render(<MarkerReadingMenu isInterpolated={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Marker readings' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Interpolated' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports that the marker should read the nearest reading', async () => {
    const onChange = vi.fn();
    render(<MarkerReadingMenu isInterpolated onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Marker readings' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Nearest reading' }));

    expect(onChange).toHaveBeenCalledWith(false);
  });
});
