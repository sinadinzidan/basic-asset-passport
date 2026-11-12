import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageNotFound } from '../PageNotFound';

describe(PageNotFound.name, () => {
  it('says the page does not exist', () => {
    render(<PageNotFound />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('This page does not exist')).toBeInTheDocument();
  });

  it('tells the reader what to check', () => {
    render(<PageNotFound />);

    expect(screen.getByText(/check the address/i)).toBeInTheDocument();
  });
});
