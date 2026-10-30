import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // React logs caught render errors; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><p>Healthy content</p></ErrorBoundary>);
    expect(screen.getByText('Healthy content')).toBeInTheDocument();
  });

  it('shows a recoverable fallback and reports the error when a child throws', () => {
    const onError = vi.fn();
    render(<ErrorBoundary onError={onError}><Crashing shouldThrow /></ErrorBoundary>);
    expect(screen.getByRole('status')).toHaveTextContent('Something went wrong');
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Render failed' }), expect.anything());
  });

  it('renders the children again after Try again when the cause is gone', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;
    const { rerender } = render(<ErrorBoundary><Crashing shouldThrow={shouldThrow} /></ErrorBoundary>);
    shouldThrow = false;
    rerender(<ErrorBoundary><Crashing shouldThrow={shouldThrow} /></ErrorBoundary>);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});

function Crashing({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Render failed');
  return <p>Recovered</p>;
}
