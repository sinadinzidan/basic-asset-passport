import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GREETING_INTRO_DELAY_MS,
  GREETING_INTRO_DURATION_MS,
} from '../../../constants/agents';
import {
  UseAgentGreetingContext,
  type UseAgentGreetingContextType,
  useAgentGreeting,
} from '../useAgentGreeting';

describe(useAgentGreeting.name, () => {
  let finishWait: () => void;
  let cancelWait: () => void;
  let context: UseAgentGreetingContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    finishWait = () => {};
    cancelWait = vi.fn();
    context = {
      startTimeout: vi.fn((onDone) => {
        finishWait = onDone;
        return cancelWait;
      }),
    };
    wrapper = ({ children }) => (
      <UseAgentGreetingContext.Provider value={context}>
        {children}
      </UseAgentGreetingContext.Provider>
    );
  });

  it('does not greet straight away, so the app can settle first', () => {
    const { result } = renderHook(() => useAgentGreeting(), { wrapper });

    expect(result.current.isIntroShown).toBe(false);
    expect(context.startTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      GREETING_INTRO_DELAY_MS,
    );
  });

  it('greets once the first wait is over', () => {
    const { result } = renderHook(() => useAgentGreeting(), { wrapper });

    act(() => finishWait());

    expect(result.current.isIntroShown).toBe(true);
    expect(context.startTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      GREETING_INTRO_DURATION_MS,
    );
  });

  it('stops greeting by itself after a few seconds, and does not start again', () => {
    const { result } = renderHook(() => useAgentGreeting(), { wrapper });
    act(() => finishWait());

    act(() => finishWait());

    expect(result.current.isIntroShown).toBe(false);
    expect(context.startTimeout).toHaveBeenCalledTimes(2);
  });

  it('stops greeting when it is dismissed', () => {
    const { result } = renderHook(() => useAgentGreeting(), { wrapper });
    act(() => finishWait());

    act(() => result.current.dismissIntro());

    expect(result.current.isIntroShown).toBe(false);
    expect(cancelWait).toHaveBeenCalled();
  });

  it('never greets when it is dismissed during the first wait', () => {
    const { result } = renderHook(() => useAgentGreeting(), { wrapper });

    act(() => result.current.dismissIntro());

    expect(result.current.isIntroShown).toBe(false);
    expect(cancelWait).toHaveBeenCalledTimes(1);
    expect(context.startTimeout).toHaveBeenCalledTimes(1);
  });

  it('cancels its wait when it goes away', () => {
    const { unmount } = renderHook(() => useAgentGreeting(), { wrapper });

    unmount();

    expect(cancelWait).toHaveBeenCalledTimes(1);
  });
});
