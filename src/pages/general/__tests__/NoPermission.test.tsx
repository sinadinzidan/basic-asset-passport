import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NoPermission } from '../NoPermission';

describe(NoPermission.name, () => {
  it('says the reader has no permission', () => {
    render(<NoPermission />);

    expect(screen.getByRole('heading', { level: 1, name: 'No permission' })).toBeInTheDocument();
    expect(screen.getByText('You cannot view this page')).toBeInTheDocument();
  });

  it('tells the reader whom to ask for access', () => {
    render(<NoPermission />);

    expect(screen.getByText(/ask your project administrator/i)).toBeInTheDocument();
  });
});
