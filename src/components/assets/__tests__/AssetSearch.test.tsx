import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AssetSearch } from '../AssetSearch';

describe('AssetSearch', () => {
  it('focuses the search field when "/" is pressed outside a text field', async () => {
    const user = userEvent.setup();
    render(<><button type="button">Other</button><AssetSearch search="" onSearchChange={vi.fn()} /></>);
    await user.click(screen.getByRole('button', { name: 'Other' }));
    await user.keyboard('/');
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toHaveFocus();
    expect(screen.getByRole('searchbox', { name: 'Search assets' })).toHaveValue('');
  });

  it('types a slash into another text field instead of stealing focus', async () => {
    const user = userEvent.setup();
    render(<><input aria-label="Other field" /><AssetSearch search="" onSearchChange={vi.fn()} /></>);
    await user.click(screen.getByRole('textbox', { name: 'Other field' }));
    await user.keyboard('/');
    expect(screen.getByRole('textbox', { name: 'Other field' })).toHaveValue('/');
  });

  it('submits the trimmed search and offers to clear an active one', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<AssetSearch search="pump" onSearchChange={onSearchChange} />);
    await user.clear(screen.getByRole('searchbox', { name: 'Search assets' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), '  valve {Enter}');
    expect(onSearchChange).toHaveBeenLastCalledWith('valve');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onSearchChange).toHaveBeenLastCalledWith('');
  });
});
