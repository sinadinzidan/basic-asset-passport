import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  UseCopyToClipboardContext,
  type UseCopyToClipboardContextType,
  useCopyToClipboard,
} from '../useCopyToClipboard';

describe(useCopyToClipboard.name, () => {
  let writeText: UseCopyToClipboardContextType['writeText'];
  let finishWait: () => void;
  let cancelWait: () => void;
  let context: UseCopyToClipboardContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    writeText = vi.fn(() => Promise.resolve());
    finishWait = () => {};
    cancelWait = vi.fn();
    context = {
      writeText,
      startTimeout: vi.fn((onDone) => {
        finishWait = onDone;
        return cancelWait;
      }),
    };
    wrapper = ({ children }) => (
      <UseCopyToClipboardContext.Provider value={context}>
        {children}
      </UseCopyToClipboardContext.Provider>
    );
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });

    expect(result.current.status).toBe('IDLE');
  });

  it('copies the text and says so', async () => {
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });

    await act(async () => {
      await result.current.copy('The strainer is fouled.');
    });

    expect(writeText).toHaveBeenCalledWith('The strainer is fouled.');
    expect(result.current.status).toBe('COPIED');
  });

  it('goes back to idle after a moment', async () => {
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });
    await act(async () => {
      await result.current.copy('text');
    });

    act(() => finishWait());

    expect(result.current.status).toBe('IDLE');
  });

  it('says so when the text could not be copied', async () => {
    vi.mocked(writeText).mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });

    await act(async () => {
      await result.current.copy('text');
    });

    expect(result.current.status).toBe('FAILED');
  });

  it('restarts the wait when copied again', async () => {
    const { result } = renderHook(() => useCopyToClipboard(), { wrapper });
    await act(async () => {
      await result.current.copy('first');
    });

    await act(async () => {
      await result.current.copy('second');
    });

    expect(cancelWait).toHaveBeenCalledTimes(1);
    expect(context.startTimeout).toHaveBeenCalledTimes(2);
  });

  it('stops waiting when it goes away', async () => {
    const { result, unmount } = renderHook(() => useCopyToClipboard(), {
      wrapper,
    });
    await act(async () => {
      await result.current.copy('text');
    });

    unmount();

    expect(cancelWait).toHaveBeenCalledTimes(1);
  });
});
