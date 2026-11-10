import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DebounceContext,
  type DebounceDeps,
} from '../../../hooks/general/useDebouncedCallback';
import { AssetSearchField } from '../AssetSearchField';

describe(AssetSearchField.name, () => {
  let scheduled: Map<number, () => void>;
  let deps: DebounceDeps;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    scheduled = new Map();
    let nextHandle = 1;
    deps = {
      setTimer: vi.fn((callback: () => void) => {
        const handle = nextHandle++;
        scheduled.set(handle, callback);
        return handle;
      }),
      clearTimer: vi.fn((handle: number) => {
        scheduled.delete(handle);
      }),
    };
    wrapper = ({ children }) => (
      <DebounceContext.Provider value={deps}>
        {children}
      </DebounceContext.Provider>
    );
  });

  it('starts with the search that is applied', () => {
    render(<AssetSearchField value="pump" onChange={vi.fn()} />, { wrapper });

    expect(
      screen.getByRole('searchbox', { name: 'Search assets' }),
    ).toHaveValue('pump');
  });

  it('shows what is typed at once but applies it only after the pause', async () => {
    const onChange = vi.fn();
    render(<AssetSearchField value="" onChange={onChange} />, { wrapper });

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search assets' }),
      'pu',
    );

    expect(screen.getByRole('searchbox')).toHaveValue('pu');
    expect(onChange).not.toHaveBeenCalled();
    fireScheduled();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('pu');
  });

  it('applies the text without the spaces around it', async () => {
    const onChange = vi.fn();
    render(<AssetSearchField value="" onChange={onChange} />, { wrapper });

    await userEvent.type(screen.getByRole('searchbox'), '  pump  ');
    fireScheduled();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('pump');
  });

  it('applies Enter at once', async () => {
    const onChange = vi.fn();
    render(<AssetSearchField value="" onChange={onChange} />, { wrapper });

    await userEvent.type(screen.getByRole('searchbox'), 'pump{Enter}');

    expect(onChange).toHaveBeenCalledExactlyOnceWith('pump');
    expect(scheduled.size).toBe(0);
  });

  it('clears the search at once from the clear button', async () => {
    const onChange = vi.fn();
    render(<AssetSearchField value="pump" onChange={onChange} />, { wrapper });
    await userEvent.click(screen.getByRole('searchbox'));

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith('');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  function fireScheduled(): void {
    for (const callback of [...scheduled.values()]) callback();
    scheduled.clear();
  }
});
