import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RetryAlert } from '../RetryAlert';

describe(RetryAlert.name, () => {
  it('explains what failed and how to recover', () => {
    render(
      <RetryAlert
        title="Could not load"
        description="Check access, then try again."
        isRetrying={false}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Could not load')).toBeInTheDocument();
    expect(
      screen.getByText('Check access, then try again.'),
    ).toBeInTheDocument();
  });

  it('retries when the button is clicked', async () => {
    const onRetry = vi.fn();
    render(
      <RetryAlert
        title="T"
        description="D"
        isRetrying={false}
        onRetry={onRetry}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('disables the button while a retry is in flight', () => {
    render(
      <RetryAlert title="T" description="D" isRetrying onRetry={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });
});
