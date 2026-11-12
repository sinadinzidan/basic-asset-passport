import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startTimeout } from '../startTimeout';

describe(startTimeout.name, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls back once the delay has passed', () => {
    const onDone = vi.fn();

    startTimeout(onDone, 500);
    vi.advanceTimersByTime(499);
    expect(onDone).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('never calls back once it is cancelled', () => {
    const onDone = vi.fn();
    const cancel = startTimeout(onDone, 500);

    cancel();
    vi.advanceTimersByTime(1_000);

    expect(onDone).not.toHaveBeenCalled();
  });
});
