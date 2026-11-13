import { CDF_MAX_CONCURRENT_REQUESTS } from '../constants/query';

export class QueuedTaskRunner {
  private readonly waiting: Array<() => void> = [];

  private runningCount = 0;

  constructor(private readonly maxConcurrentTasks: number) {}

  schedule = async <Result>(task: () => Promise<Result>): Promise<Result> => {
    if (this.runningCount >= this.maxConcurrentTasks) {
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    } else {
      this.runningCount += 1;
    }

    try {
      return await task();
    } finally {
      const startNext = this.waiting.shift();

      if (startNext) {
        startNext();
      } else {
        this.runningCount -= 1;
      }
    }
  };
}

export const cdfTaskRunner = new QueuedTaskRunner(CDF_MAX_CONCURRENT_REQUESTS);
