import type { CogniteClient } from '@cognite/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeOfflineSdkClient } from '../../__mocks__/cogniteClient';
import { limitCdfCalls } from '../limitedCdfClient';
import { QueuedTaskRunner } from '../queuedTaskRunner';

describe(limitCdfCalls.name, () => {
  let client: CogniteClient;

  beforeEach(() => {
    client = makeOfflineSdkClient('my-project');
  });

  it('keeps the project of the client', () => {
    expect(limitCdfCalls(client).project).toBe('my-project');
  });

  it('passes an instance query on to the client and gives back its answer', async () => {
    const answer = { items: {}, nextCursor: {} };
    const query = vi.spyOn(client.instances, 'query').mockResolvedValue(answer);
    const request = { with: {}, select: {} };

    await expect(limitCdfCalls(client).instances.query(request)).resolves.toBe(answer);
    expect(query).toHaveBeenCalledExactlyOnceWith(request);
  });

  it('passes a post on to the client with its path and options', async () => {
    const answer = { data: { items: [] }, status: 200, headers: {} };
    const post = vi.spyOn(client, 'post').mockResolvedValue(answer);

    await expect(limitCdfCalls(client).post('/path', { data: { a: 1 } })).resolves.toBe(answer);
    expect(post).toHaveBeenCalledExactlyOnceWith('/path', { data: { a: 1 } });
  });

  it('passes a failure of the client on', async () => {
    vi.spyOn(client.instances, 'aggregate').mockRejectedValue(new Error('no access'));

    await expect(
      limitCdfCalls(client).instances.aggregate({
        view: { type: 'view', space: 's', externalId: 'Asset', version: '1' },
        instanceType: 'node',
        aggregates: [],
      }),
    ).rejects.toThrow('no access');
  });

  it('holds a call back while the runner is full', async () => {
    const runner = new QueuedTaskRunner(1);
    let release: () => void = () => {};
    const blocker = runner.schedule(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const me = vi
      .spyOn(client.profiles, 'me')
      .mockResolvedValue({ userIdentifier: 'u', lastUpdatedTime: 0 });

    const profile = limitCdfCalls(client, runner).profiles.me();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(me).not.toHaveBeenCalled();

    release();
    await blocker;
    await expect(profile).resolves.toEqual({ userIdentifier: 'u', lastUpdatedTime: 0 });
  });

  it('covers every call the app makes through the client', () => {
    const limited = limitCdfCalls(client);

    expect(Object.keys(limited.instances).sort()).toEqual([
      'aggregate',
      'delete',
      'query',
      'search',
      'upsert',
    ]);
    expect(Object.keys(limited.dataModels)).toEqual(['retrieve']);
    expect(Object.keys(limited.profiles)).toEqual(['me']);
  });
});
