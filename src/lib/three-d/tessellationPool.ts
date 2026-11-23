import type { TessellatedMesh } from '../../types/threeD';

export type TessellationReply =
  | { id: number; mesh: TessellatedMesh; error?: undefined }
  | { id: number; error: string; mesh?: undefined };

export type TessellationWorker = {
  onReply: (reply: TessellationReply) => void;
  onCrash: () => void;
  run: (id: number, buffer: ArrayBuffer) => void;
  terminate: () => void;
};

export type TessellationPool = {
  tessellate: (buffer: ArrayBuffer) => Promise<TessellatedMesh>;
  dispose: () => void;
};

type Job = {
  id: number;
  buffer: ArrayBuffer;
  resolve: (mesh: TessellatedMesh) => void;
  reject: (error: Error) => void;
};

type PoolProps = { size: number; createWorker: () => TessellationWorker };

export function createTessellationPool({ size, createWorker }: PoolProps): TessellationPool {
  const queue: Job[] = [];
  const running = new Map<TessellationWorker, Job>();
  const idle: TessellationWorker[] = [];
  let nextId = 0;
  let isDisposed = false;

  function finish(worker: TessellationWorker, settle: (job: Job) => void): void {
    const job = running.get(worker);

    if (job === undefined) return;

    running.delete(worker);
    settle(job);
    idle.push(worker);
    dispatch();
  }

  function dispatch(): void {
    while (!isDisposed && queue.length > 0 && idle.length > 0) {
      const worker = idle.shift();
      const job = queue.shift();

      if (worker === undefined || job === undefined) return;

      running.set(worker, job);
      worker.run(job.id, job.buffer);
    }
  }

  Array.from({ length: size }, () => {
    const worker = createWorker();

    worker.onReply = (reply) =>
      finish(worker, (job) => {
        if (reply.mesh === undefined) job.reject(new Error(reply.error));
        else job.resolve(reply.mesh);
      });

    worker.onCrash = () =>
      finish(worker, (job) => job.reject(new Error('Tessellation worker crashed.')));

    idle.push(worker);

    return worker;
  });

  return {
    tessellate: (buffer) =>
      new Promise((resolve, reject) => {
        if (isDisposed) {
          reject(new Error('Tessellation pool disposed.'));

          return;
        }

        queue.push({ id: nextId, buffer, resolve, reject });
        nextId += 1;
        dispatch();
      }),
    dispose: () => {
      isDisposed = true;
      const error = new Error('Tessellation pool disposed.');

      running.forEach((job, worker) => {
        job.reject(error);
        worker.terminate();
      });

      idle.forEach((worker) => worker.terminate());
      queue.splice(0).forEach((job) => job.reject(error));
      running.clear();
      idle.length = 0;
    },
  };
}
