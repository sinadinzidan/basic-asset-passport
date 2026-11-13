import { describe, expect, it } from 'vitest';

import { CDF_MAX_CONCURRENT_REQUESTS } from '../../constants/query';
import { cdfTaskRunner, QueuedTaskRunner } from '../queuedTaskRunner';

type Deferred = { promise: Promise<string>; resolve: (value: string) => void };

function defer(): Deferred {
  let resolve: (value: string) => void = () => {};
  const promise = new Promise<string>((settle) => {
    resolve = settle;
  });

  return { promise, resolve };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe(QueuedTaskRunner.name, () => {
  it('gives back what the task resolves with', async () => {
    const runner = new QueuedTaskRunner(2);

    await expect(runner.schedule(() => Promise.resolve('done'))).resolves.toBe('done');
  });

  it('runs no more tasks at once than its limit', async () => {
    const runner = new QueuedTaskRunner(2);
    const started: number[] = [];
    const tasks = [defer(), defer(), defer()];

    const results = tasks.map((task, index) =>
      runner.schedule(() => {
        started.push(index);

        return task.promise;
      }),
    );

    await flush();

    expect(started).toEqual([0, 1]);

    tasks[0]?.resolve('first');
    await flush();

    expect(started).toEqual([0, 1, 2]);
    tasks[1]?.resolve('second');
    tasks[2]?.resolve('third');
    await expect(Promise.all(results)).resolves.toEqual(['first', 'second', 'third']);
  });

  it('starts waiting tasks in the order they were scheduled', async () => {
    const runner = new QueuedTaskRunner(1);
    const started: string[] = [];
    const blocker = defer();

    const first = runner.schedule(() => blocker.promise);
    const second = runner.schedule(() => {
      started.push('second');

      return Promise.resolve('second');
    });
    const third = runner.schedule(() => {
      started.push('third');

      return Promise.resolve('third');
    });

    blocker.resolve('first');
    await Promise.all([first, second, third]);

    expect(started).toEqual(['second', 'third']);
  });

  it('passes on a failure and frees its slot for the next task', async () => {
    const runner = new QueuedTaskRunner(1);

    const failed = runner.schedule(() => Promise.reject(new Error('no access')));
    const next = runner.schedule(() => Promise.resolve('next'));

    await expect(failed).rejects.toThrow('no access');
    await expect(next).resolves.toBe('next');
  });

  it('does not let a new task jump ahead of one that is waiting', async () => {
    const runner = new QueuedTaskRunner(1);
    const started: string[] = [];
    const blocker = defer();
    const first = runner.schedule(() => blocker.promise);
    const waiting = runner.schedule(() => {
      started.push('waiting');

      return Promise.resolve('waiting');
    });

    blocker.resolve('first');
    const late = runner.schedule(() => {
      started.push('late');

      return Promise.resolve('late');
    });

    await Promise.all([first, waiting, late]);

    expect(started).toEqual(['waiting', 'late']);
  });
});

describe('cdfTaskRunner', () => {
  it('caps CDF requests at the configured number', async () => {
    const tasks = Array.from({ length: CDF_MAX_CONCURRENT_REQUESTS + 1 }, defer);
    let startedCount = 0;

    const results = tasks.map((task) =>
      cdfTaskRunner.schedule(() => {
        startedCount += 1;

        return task.promise;
      }),
    );

    await flush();

    expect(startedCount).toBe(CDF_MAX_CONCURRENT_REQUESTS);
    tasks.forEach((task) => task.resolve('done'));
    await Promise.all(results);
    expect(startedCount).toBe(CDF_MAX_CONCURRENT_REQUESTS + 1);
  });
});
