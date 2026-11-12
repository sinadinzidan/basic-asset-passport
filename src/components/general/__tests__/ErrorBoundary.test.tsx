import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '../ErrorBoundary';

function Exploding({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('render failed');
  return <p>Recovered content</p>;
}

describe(ErrorBoundary.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders its children when nothing fails', () => {
    render(
      <ErrorBoundary onError={vi.fn()}>
        <Exploding shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('shows a readable error with a retry action when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary onError={vi.fn()}>
        <Exploding shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows the error on the themed stage, which the failed page took with it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary onError={vi.fn()}>
        <Exploding shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong').closest('.neon-stage')).not.toBeNull();
  });

  it('reports the error to the injected handler', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <Exploding shouldThrow />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });

  it('renders the children again after Retry once the cause is gone', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Toggle() {
      return <Exploding shouldThrow={shouldThrow} />;
    }
    render(
      <ErrorBoundary onError={vi.fn()}>
        <Toggle />
      </ErrorBoundary>,
    );
    shouldThrow = false;

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });
});
