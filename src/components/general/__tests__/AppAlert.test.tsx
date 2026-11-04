import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppAlert } from '../AppAlert';

describe(AppAlert.name, () => {
  it('shows the title and the message', () => {
    render(
      <AppAlert variant="error" title="Could not load">
        Check access, then try again.
      </AppAlert>,
    );

    expect(screen.getByText('Could not load')).toBeInTheDocument();
    expect(
      screen.getByText('Check access, then try again.'),
    ).toBeInTheDocument();
  });

  it('works without a title', () => {
    render(<AppAlert variant="info">Just a note.</AppAlert>);

    expect(screen.getByText('Just a note.')).toBeInTheDocument();
  });

  it.each(['error', 'warning'] as const)(
    'announces a %s immediately as an alert',
    (variant) => {
      render(<AppAlert variant={variant}>Message</AppAlert>);

      expect(screen.getByRole('alert')).toHaveAttribute(
        'data-variant',
        variant,
      );
    },
  );

  it.each(['info', 'success'] as const)(
    'announces %s politely as a status',
    (variant) => {
      render(<AppAlert variant={variant}>Message</AppAlert>);

      expect(screen.getByRole('status')).toHaveAttribute(
        'data-variant',
        variant,
      );
    },
  );

  it('shows an action when given', () => {
    render(
      <AppAlert variant="error" action={<button>Retry</button>}>
        Message
      </AppAlert>,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('hides the decorative icon from assistive technology', () => {
    const { container } = render(
      <AppAlert variant="warning">Message</AppAlert>,
    );

    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
