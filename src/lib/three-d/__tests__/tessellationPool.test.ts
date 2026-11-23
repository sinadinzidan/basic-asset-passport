import { describe, expect, it } from 'vitest';

import type { TessellatedMesh } from '../../../types/threeD';
import {
  createTessellationPool,
  type TessellationReply,
  type TessellationWorker,
} from '../tessellationPool';

describe(createTessellationPool.name, () => {
  it('hands a buffer to a worker and resolves with its mesh', async () => {
    const { pool, workers } = setup({ size: 1 });
    const buffer = new ArrayBuffer(4);

    const result = pool.tessellate(buffer);

    workers[0].reply({ id: workers[0].lastId(), mesh: makeMesh(3) });

    expect((await result).indices.length).toBe(3);
    expect(workers[0].transferred).toEqual([buffer]);
  });

  it('spreads work over the workers and queues the rest', async () => {
    const { pool, workers } = setup({ size: 2 });

    const results = [1, 2, 3].map(() => pool.tessellate(new ArrayBuffer(1)));

    expect(workers.map((worker) => worker.jobs)).toEqual([1, 1]);

    workers[0].reply({ id: workers[0].lastId(), mesh: makeMesh(3) });
    await results[0];

    expect(workers[0].jobs).toBe(2);
  });

  it('rejects the job when the worker reports an error', async () => {
    const { pool, workers } = setup({ size: 1 });

    const result = pool.tessellate(new ArrayBuffer(1));

    workers[0].reply({ id: workers[0].lastId(), error: 'bad sector' });

    await expect(result).rejects.toThrow('bad sector');
  });

  it('rejects the job when the worker crashes', async () => {
    const { pool, workers } = setup({ size: 1 });

    const result = pool.tessellate(new ArrayBuffer(1));

    workers[0].crash();

    await expect(result).rejects.toThrow('crashed');
  });

  it('stops every worker and rejects waiting jobs when disposed', async () => {
    const { pool, workers } = setup({ size: 1 });

    const running = pool.tessellate(new ArrayBuffer(1));
    const waiting = pool.tessellate(new ArrayBuffer(1));

    pool.dispose();

    await expect(running).rejects.toThrow('disposed');
    await expect(waiting).rejects.toThrow('disposed');
    expect(workers[0].isTerminated).toBe(true);
  });

  function setup({ size }: { size: number }) {
    const workers: FakeWorker[] = [];

    const pool = createTessellationPool({
      size,
      createWorker: () => {
        const worker = new FakeWorker();

        workers.push(worker);

        return worker;
      },
    });

    return { pool, workers };
  }
});

class FakeWorker implements TessellationWorker {
  onReply: (reply: TessellationReply) => void = () => undefined;
  onCrash: () => void = () => undefined;
  jobs = 0;
  transferred: ArrayBuffer[] = [];
  isTerminated = false;
  private ids: number[] = [];

  run(id: number, buffer: ArrayBuffer): void {
    this.jobs += 1;
    this.ids.push(id);
    this.transferred.push(buffer);
  }

  terminate(): void {
    this.isTerminated = true;
  }

  lastId(): number {
    return this.ids[this.ids.length - 1];
  }

  reply(reply: TessellationReply): void {
    this.onReply(reply);
  }

  crash(): void {
    this.onCrash();
  }
}

function makeMesh(indexCount: number): TessellatedMesh {
  return {
    positions: new Float32Array(0),
    normals: new Float32Array(0),
    colors: new Float32Array(0),
    treeIndices: new Float32Array(0),
    indices: new Uint32Array(indexCount),
    unsupported: {},
  };
}
