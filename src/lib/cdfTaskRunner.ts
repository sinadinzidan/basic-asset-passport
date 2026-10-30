const MAX_CONCURRENT_CDF_TASKS = 15;
const MAX_THROTTLE_RETRIES = 4;
const THROTTLE_BASE_DELAY_MS = 500;
const THROTTLE_MAX_DELAY_MS = 8_000;
const HTTP_TOO_MANY_REQUESTS = 429;

export interface QueuedTaskRunnerOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  random?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
}

function isThrottleError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === HTTP_TOO_MANY_REQUESTS;
}

const defaultSleep = (milliseconds: number) => new Promise<void>((resolve) => { setTimeout(resolve, milliseconds); });

export class QueuedTaskRunner {
  private active = 0;
  private readonly queue: Array<() => void> = [];
  private readonly maxRetries: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly random: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly maxConcurrent: number = MAX_CONCURRENT_CDF_TASKS, options: QueuedTaskRunnerOptions = {}) {
    if (!Number.isSafeInteger(maxConcurrent) || maxConcurrent < 1) {
      throw new Error('CDF task concurrency must be a positive integer.');
    }
    this.maxRetries = options.maxRetries ?? MAX_THROTTLE_RETRIES;
    this.baseDelayMs = options.baseDelayMs ?? THROTTLE_BASE_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? THROTTLE_MAX_DELAY_MS;
    this.random = options.random ?? Math.random;
    this.sleep = options.sleep ?? defaultSleep;
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async (): Promise<void> => {
        this.active++;
        try {
          resolve(await this.runWithBackoff(task));
        } catch (error: unknown) {
          reject(error);
        } finally {
          this.active--;
          this.queue.shift()?.();
        }
      };
      if (this.active < this.maxConcurrent) void run();
      else this.queue.push(() => void run());
    });
  }

  // Only HTTP 429 is retried: exponential backoff with full jitter, bounded by maxRetries.
  private async runWithBackoff<T>(task: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await task();
      } catch (error: unknown) {
        if (!isThrottleError(error) || attempt >= this.maxRetries) throw error;
        const ceiling = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** attempt);
        await this.sleep(Math.floor(this.random() * ceiling));
      }
    }
  }
}

export const cdfTaskRunner = new QueuedTaskRunner();
