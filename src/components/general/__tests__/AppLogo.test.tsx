import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppLogo } from '../AppLogo';

describe(AppLogo.name, () => {
  it('shows the logo image', () => {
    render(<AppLogo alt="Company logo" fallbackText="Asset Passport" source="/logo.svg" />);

    expect(screen.getByRole('img', { name: 'Company logo' })).toHaveAttribute('src', '/logo.svg');
  });

  it('falls back to the app name when the image cannot load', () => {
    render(<AppLogo alt="Company logo" fallbackText="Asset Passport" source="/missing.svg" />);

    fireEvent.error(screen.getByRole('img', { name: 'Company logo' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Asset Passport')).toBeInTheDocument();
  });
});
