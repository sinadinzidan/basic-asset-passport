import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CursorPagination } from '../CursorPagination';

function renderPagination(
  overrides: Partial<Parameters<typeof CursorPagination>[0]> = {},
) {
  const props = {
    label: 'Asset table pagination',
    pageNumber: 2,
    hasPreviousPage: true,
    hasNextPage: true,
    isFetching: false,
    onPreviousPage: vi.fn(),
    onNextPage: vi.fn(),
    ...overrides,
  };
  render(<CursorPagination {...props} />);
  return props;
}

describe(CursorPagination.name, () => {
  it('shows the current page in a labelled navigation', () => {
    renderPagination();

    expect(
      screen.getByRole('navigation', { name: 'Asset table pagination' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });

  it('calls the matching handler for each button', async () => {
    const props = renderPagination();

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Previous page' }),
    );

    expect(props.onNextPage).toHaveBeenCalledTimes(1);
    expect(props.onPreviousPage).toHaveBeenCalledTimes(1);
  });

  it('disables buttons that have nowhere to go', () => {
    renderPagination({ hasPreviousPage: false, hasNextPage: false });

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('disables both buttons while fetching', () => {
    renderPagination({ isFetching: true });

    expect(
      screen.getByRole('button', { name: 'Previous page' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
