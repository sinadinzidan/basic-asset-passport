import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ShowMoreButton } from '../ShowMoreButton';

describe(ShowMoreButton.name, () => {
  it('asks for more when it is pressed', async () => {
    const onShowMore = vi.fn();
    render(
      <ShowMoreButton label="Show more documents" isLoading={false} onShowMore={onShowMore} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show more documents' }));

    expect(onShowMore).toHaveBeenCalledTimes(1);
  });

  it('is disabled and says so while more is loading', () => {
    render(<ShowMoreButton label="Show more documents" isLoading onShowMore={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Loading...' })).toBeDisabled();
  });
});
