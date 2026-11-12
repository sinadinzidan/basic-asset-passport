import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState, LoadingRows, QueryState } from '../QueryState';

describe(QueryState.name, () => {
  it('shows what the children make of the data', () => {
    renderState({ data: ['PT-101', 'FT-200'] });

    expect(screen.getByText('PT-101, FT-200')).toBeInTheDocument();
  });

  it('shows loading rows while the data is loading', () => {
    renderState({ data: undefined, isLoading: true });

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows loading rows while there is no data yet', () => {
    renderState({ data: undefined, isLoading: false });

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('shows as many loading rows as it is told', () => {
    renderState({ data: undefined, isLoading: true, skeletonRows: 2 });

    expect(screen.getByRole('status', { name: 'Loading' }).children).toHaveLength(2);
  });

  it('shows a failure as a failure, never as data', () => {
    renderState({ data: ['PT-101'], error: new Error('The source is down') });

    expect(screen.getByRole('alert')).toHaveTextContent('This could not be loaded');
    expect(screen.getByRole('alert')).toHaveTextContent('The source is down');
    expect(screen.queryByText('PT-101')).not.toBeInTheDocument();
  });

  it('offers to try again after a failure', async () => {
    const onRetry = vi.fn();
    renderState({ error: new Error('The source is down'), onRetry });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says so when the data is empty', () => {
    renderState({
      data: [],
      isEmpty: (data) => data.length === 0,
      emptyTitle: 'No series yet',
      emptyDescription: 'Add a series to see it here.',
    });

    expect(screen.getByRole('status')).toHaveTextContent('No series yet');
    expect(screen.getByText('Add a series to see it here.')).toBeInTheDocument();
  });

  it('says "Nothing here yet" when the empty state is not named', () => {
    renderState({ data: [], isEmpty: (data) => data.length === 0 });

    expect(screen.getByRole('status')).toHaveTextContent('Nothing here yet');
  });

  it('hands empty data to the children when it is not told what empty is', () => {
    renderState({ data: [] });

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});

describe(LoadingRows.name, () => {
  it('shows four rows unless told otherwise', () => {
    render(<LoadingRows />);

    expect(screen.getByRole('status', { name: 'Loading' }).children).toHaveLength(4);
  });
});

describe(ErrorState.name, () => {
  it('shows the reason as an alert', () => {
    render(<ErrorState error={new Error('Not allowed')} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
  });

  it('offers no retry when there is none to make', () => {
    render(<ErrorState error={new Error('Not allowed')} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function renderState(overrides: Partial<Parameters<typeof QueryState<string[]>>[0]> = {}) {
  return render(
    <QueryState<string[]> data={['PT-101']} isLoading={false} error={null} {...overrides}>
      {(data) => <p data-testid="content">{data.join(', ')}</p>}
    </QueryState>,
  );
}
