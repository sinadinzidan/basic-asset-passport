import { describe, expect, it, vi } from 'vitest';

import { QueuedTaskRunner } from '../cdfTaskRunner';

describe('QueuedTaskRunner', () => {
  it('limits concurrency and releases the next task after a failure', async () => {
    const runner = new QueuedTaskRunner(1);
    let release: () => void = () => { throw new Error('Task not started'); };
    const first = runner.schedule(() => new Promise<void>((resolve) => { release = resolve; }));
    let hasStarted = false;
    const second = runner.schedule(async () => { hasStarted = true; throw new Error('Failed'); });
    expect(hasStarted).toBe(false);
    release();
    await first;
    await expect(second).rejects.toThrow('Failed');
    expect(await runner.schedule(async () => 42)).toBe(42);
  });

  it('retries throttled (429) tasks with jittered exponential backoff', async () => {
    const sleep = vi.fn(async (_milliseconds: number) => undefined);
    const runner = new QueuedTaskRunner(1, { baseDelayMs: 100, random: () => 0.5, sleep });
    const task = vi.fn()
      .mockRejectedValueOnce(throttleError())
      .mockRejectedValueOnce(throttleError())
      .mockResolvedValue('ok');
    expect(await runner.schedule(task)).toBe('ok');
    expect(task).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([50, 100]);
  });

  it('stops retrying after the retry limit and surfaces the 429', async () => {
    const runner = new QueuedTaskRunner(1, { maxRetries: 2, sleep: async () => undefined });
    const task = vi.fn(async () => { throw throttleError(); });
    await expect(runner.schedule(task)).rejects.toMatchObject({ status: 429 });
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('does not retry other failures', async () => {
    const sleep = vi.fn(async () => undefined);
    const runner = new QueuedTaskRunner(1, { sleep });
    const task = vi.fn(async () => { throw Object.assign(new Error('Server error'), { status: 500 }); });
    await expect(runner.schedule(task)).rejects.toThrow('Server error');
    expect(task).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it('rejects an invalid concurrency', () => {
    expect(() => new QueuedTaskRunner(0)).toThrow('positive integer');
  });
});

function throttleError() {
  return Object.assign(new Error('Too many requests'), { status: 429 });
}
