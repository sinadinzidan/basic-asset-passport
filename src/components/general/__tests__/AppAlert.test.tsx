import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppAlertVariant } from '../../../enums/appAlertVariant';
import { AppAlert } from '../AppAlert';

describe(AppAlert.name, () => {
  it('shows the title and the message', () => {
    render(
      <AppAlert variant={AppAlertVariant.ERROR} title="Could not load">
        Check access, then try again.
      </AppAlert>,
    );

    expect(screen.getByText('Could not load')).toBeInTheDocument();
    expect(screen.getByText('Check access, then try again.')).toBeInTheDocument();
  });

  it('works without a title', () => {
    render(<AppAlert variant={AppAlertVariant.INFO}>Just a note.</AppAlert>);

    expect(screen.getByText('Just a note.')).toBeInTheDocument();
  });

  it.each([
    [AppAlertVariant.ERROR, 'error'],
    [AppAlertVariant.WARNING, 'warning'],
  ])('announces a %s immediately as an alert', (variant, dataVariant) => {
    render(<AppAlert variant={variant}>Message</AppAlert>);

    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', dataVariant);
  });

  it.each([
    [AppAlertVariant.INFO, 'info'],
    [AppAlertVariant.SUCCESS, 'success'],
  ])('announces %s politely as a status', (variant, dataVariant) => {
    render(<AppAlert variant={variant}>Message</AppAlert>);

    expect(screen.getByRole('status')).toHaveAttribute('data-variant', dataVariant);
  });

  it('shows an action when given', () => {
    render(
      <AppAlert variant={AppAlertVariant.ERROR} action={<button>Retry</button>}>
        Message
      </AppAlert>,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('hides the decorative icon from assistive technology', () => {
    const { container } = render(<AppAlert variant={AppAlertVariant.WARNING}>Message</AppAlert>);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
