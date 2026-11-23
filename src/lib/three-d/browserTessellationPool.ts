import { THREE_D_FALLBACK_CORES, THREE_D_MAX_WORKERS } from '../../constants/threeD';

import {
  createTessellationPool,
  type TessellationPool,
  type TessellationReply,
  type TessellationWorker,
} from './tessellationPool';

function createBrowserWorker(): TessellationWorker {
  const worker = new Worker(new URL('./tessellateWorker.ts', import.meta.url), { type: 'module' });

  const adapter: TessellationWorker = {
    onReply: () => undefined,
    onCrash: () => undefined,
    run: (id, buffer) => worker.postMessage({ id, buffer }, [buffer]),
    terminate: () => worker.terminate(),
  };

  worker.onmessage = (event: MessageEvent<TessellationReply>) => adapter.onReply(event.data);
  worker.onerror = () => adapter.onCrash();

  return adapter;
}

export function createBrowserTessellationPool(): TessellationPool {
  const cores = navigator.hardwareConcurrency || THREE_D_FALLBACK_CORES;

  return createTessellationPool({
    size: Math.max(1, Math.min(THREE_D_MAX_WORKERS, cores - 1)),
    createWorker: createBrowserWorker,
  });
}
