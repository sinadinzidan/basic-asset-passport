import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingNotice } from '../LoadingNotice';

describe(LoadingNotice.name, () => {
  it('announces the message as a status', () => {
    render(<LoadingNotice message="Loading things..." />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading things...');
  });

  it('applies the given class name to the status row', () => {
    render(<LoadingNotice className="p-10" message="Loading things..." />);

    expect(screen.getByRole('status')).toHaveClass('p-10');
  });
});
