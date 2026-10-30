import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AssetPagination } from '../AssetPagination';

type PaginationProps = Parameters<typeof AssetPagination>[0];

describe('AssetPagination', () => {
  it('summarises the visible range and disables going back on the first page', () => {
    renderPagination({ page: 0, pageItemCount: 10, hasNextPage: true });
    expect(screen.getByText('Showing 1–10')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'First page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Next page' })).not.toHaveAttribute('aria-disabled');
  });

  it('shows the range of a later page with its own page size and marks the last page', () => {
    renderPagination({ page: 2, pageSize: 25, pageItemCount: 3, hasNextPage: false });
    expect(screen.getByText('Showing 51–53 (last page)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('names a single result without a range', () => {
    renderPagination({ page: 1, pageItemCount: 1, hasNextPage: false });
    expect(screen.getByText('Showing 11 (last page)')).toBeInTheDocument();
  });

  it('goes to the previous, next and first page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderPagination({ page: 2, pageItemCount: 10, hasNextPage: true, onPageChange });
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(onPageChange.mock.calls).toEqual([[3], [1], [0]]);
  });

  it('blocks navigation while fetching or after an error and says which page is loading', () => {
    renderPagination({ page: 1, pageItemCount: 10, hasNextPage: true, isFetching: true });
    expect(screen.getByText('Loading page 2…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('blocks going forward after an error', () => {
    renderPagination({ page: 0, pageItemCount: 0, hasNextPage: true, hasError: true });
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });
});

function renderPagination(props: Partial<PaginationProps>): void {
  render(
    <AssetPagination page={0} pageSize={10} onPageSizeChange={vi.fn()} pageItemCount={0} hasNextPage={false}
      isFetching={false} isLoading={false} hasError={false} onPageChange={vi.fn()} {...props} />
  );
}
