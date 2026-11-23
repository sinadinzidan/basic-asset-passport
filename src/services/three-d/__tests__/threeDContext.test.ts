import type { CogniteClient, HttpResponse, Revision3D } from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { createThreeDContext } from '../threeDContext';

type FakeSdk = Pick<CogniteClient, 'project' | 'get' | 'post' | 'revisions3D'>;

const MODEL_REF = { name: 'Platform VPH', modelId: 7, revisionId: 2 };

function makeRevision(overrides: Partial<Revision3D> = {}): Revision3D {
  return {
    id: MODEL_REF.revisionId,
    fileId: 1,
    published: false,
    status: 'Done',
    createdTime: new Date(0),
    assetMappingCount: 0,
    rotation: [1, 2, 3],
    ...overrides,
  };
}

function response(data: unknown): HttpResponse<never> {
  return { data } as Partial<HttpResponse<unknown>> as HttpResponse<never>;
}

const SCENE_JSON = {
  version: 9,
  unit: 'Meters',
  sectors: [
    {
      id: 2,
      depth: 1,
      boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 5, z: 5 } },
      sectorFileName: '2.glb',
      downloadSize: 20,
    },
    {
      id: 0,
      depth: 0,
      boundingBox: { min: { x: -1, y: -2, z: -3 }, max: { x: 10, y: 10, z: 10 } },
      sectorFileName: '0.glb',
      downloadSize: 10,
    },
    {
      id: 1,
      depth: 1,
      boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
      downloadSize: 0,
    },
  ],
};

function makeSdk(
  overrides: {
    revision?: Revision3D;
    outputs?: unknown;
    scene?: unknown;
    nodePages?: unknown[];
  } = {},
) {
  const revision = overrides.revision ?? makeRevision();
  const get = vi.fn((path: string) => {
    if (path.endsWith('/outputs')) {
      return Promise.resolve(
        response(
          overrides.outputs ?? {
            items: [
              { format: 'reveal-directory', version: 8, blobId: 5 },
              { format: 'gltf-directory', version: 9, blobId: 100 },
              { format: 'gltf-directory', version: 10, blobId: 200 },
            ],
          },
        ),
      );
    }

    return Promise.resolve(response(overrides.scene ?? SCENE_JSON));
  });
  const retrieve = vi.fn(() => Promise.resolve(revision));
  const pages = [...(overrides.nodePages ?? [])];
  const post = vi.fn(() => Promise.resolve(response(pages.shift() ?? { items: [] })));
  const sdk = {
    project: 'flows-builder',
    get,
    post,
    revisions3D: { retrieve } as Partial<
      CogniteClient['revisions3D']
    > as CogniteClient['revisions3D'],
  } as Partial<CogniteClient> as FakeSdk;

  return { sdk, get, post, retrieve };
}

const runNow = { schedule: <Result>(task: () => Promise<Result>) => task() };

describe('createThreeDContext', () => {
  it('names its project', () => {
    expect(createThreeDContext(makeSdk().sdk, runNow).project).toBe('flows-builder');
  });

  describe('loadModel', () => {
    it('reads the model by its ids: the revision placement, the newest glTF output and the scene', async () => {
      const { sdk, get, retrieve } = makeSdk();

      const model = await createThreeDContext(sdk, runNow).loadModel(MODEL_REF);

      expect(model).toMatchObject({
        modelId: 7,
        revisionId: 2,
        name: 'Platform VPH',
        blobId: 200,
        rotation: [1, 2, 3],
        scale: null,
        translation: null,
      });
      expect(retrieve).toHaveBeenCalledWith(7, 2);
      expect(get).toHaveBeenCalledWith(
        '/api/v1/projects/flows-builder/3d/models/7/revisions/2/outputs',
        {
          params: { format: 'gltf-directory' },
        },
      );
      expect(get).toHaveBeenCalledWith('/api/v1/projects/flows-builder/3d/files/200/scene.json');
    });

    it('lists the sectors with a file, the coarsest first, and covers every box', async () => {
      const model = await createThreeDContext(makeSdk().sdk, runNow).loadModel(MODEL_REF);

      expect(model.scene.sectors).toEqual([
        { id: 0, depth: 0, fileName: '0.glb', downloadSize: 10 },
        { id: 2, depth: 1, fileName: '2.glb', downloadSize: 20 },
      ]);
      expect(model.scene.boundingBox).toEqual({ min: [-1, -2, -3], max: [10, 10, 10] });
      expect(model.scene.unit).toBe('Meters');
    });

    it('accepts a revision that is not published', async () => {
      const { sdk } = makeSdk({ revision: makeRevision({ published: false }) });

      await expect(createThreeDContext(sdk, runNow).loadModel(MODEL_REF)).resolves.toBeDefined();
    });

    it('says so when the revision is not ready', async () => {
      const { sdk } = makeSdk({ revision: makeRevision({ status: 'Processing' }) });

      await expect(createThreeDContext(sdk, runNow).loadModel(MODEL_REF)).rejects.toThrow(
        'The Platform VPH revision is not ready.',
      );
    });

    it('says so when the revision has no glTF output', async () => {
      const { sdk } = makeSdk({
        outputs: { items: [{ format: 'reveal-directory', version: 8, blobId: 5 }] },
      });

      await expect(createThreeDContext(sdk, runNow).loadModel(MODEL_REF)).rejects.toThrow(
        'The revision has no gltf-directory output to show.',
      );
    });

    it('refuses a scene file of a version it cannot read', async () => {
      const { sdk } = makeSdk({ scene: { ...SCENE_JSON, version: 8 } });

      await expect(createThreeDContext(sdk, runNow).loadModel(MODEL_REF)).rejects.toThrow();
    });

    it('goes through the limiter for every call it makes', async () => {
      const schedule = vi.fn();

      schedule.mockImplementation((task: () => Promise<unknown>) => task());

      await createThreeDContext(makeSdk().sdk, {
        schedule: <Result>(task: () => Promise<Result>) => schedule(task),
      }).loadModel(MODEL_REF);

      expect(schedule).toHaveBeenCalledTimes(3);
    });
  });

  describe('loadAssetNodes', () => {
    const nodeItem = (name: string, objectId: string, treeIndexes: number[], sizes: number[]) => ({
      properties: {
        cdf_cdm: {
          'CogniteCADNode/v1': {
            name,
            object3D: { space: 'energy_instances', externalId: objectId },
            treeIndexes,
            subTreeSizes: sizes,
          },
        },
      },
    });

    it('reads the contextualised nodes of the revision with their tree ranges', async () => {
      const { sdk, post } = makeSdk({
        nodePages: [
          {
            items: [
              nodeItem('WMT:1', 'obj_1', [10], [3]),
              nodeItem('WMT:2', 'obj_2', [20, 40], [1, 2]),
            ],
          },
        ],
      });

      const nodes = await createThreeDContext(sdk, runNow).loadAssetNodes(MODEL_REF);

      expect(nodes).toEqual([
        { key: 'energy_instances:obj_1', name: 'WMT:1', ranges: [{ start: 10, size: 3 }] },
        {
          key: 'energy_instances:obj_2',
          name: 'WMT:2',
          ranges: [
            { start: 20, size: 1 },
            { start: 40, size: 2 },
          ],
        },
      ]);
      expect(post).toHaveBeenCalledWith(
        '/api/v1/projects/flows-builder/models/instances/list',
        expect.objectContaining({
          data: expect.objectContaining({
            instanceType: 'node',
            filter: {
              containsAny: {
                property: ['cdf_cdm', 'CogniteCADNode/v1', 'revisions'],
                values: [{ space: 'energy_instances', externalId: 'cog_3d_revision_2' }],
              },
            },
          }),
        }),
      );
    });

    it('follows the cursor until the last page', async () => {
      const { sdk, post } = makeSdk({
        nodePages: [
          { items: [nodeItem('A', 'a', [1], [1])], nextCursor: 'c2' },
          { items: [nodeItem('B', 'b', [2], [1])] },
        ],
      });

      const nodes = await createThreeDContext(sdk, runNow).loadAssetNodes(MODEL_REF);

      expect(nodes.map((found) => found.name)).toEqual(['A', 'B']);
      expect(post).toHaveBeenCalledTimes(2);
      expect(post).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ data: expect.objectContaining({ cursor: 'c2' }) }),
      );
    });

    it('skips a node that has no object or no tree range', async () => {
      const { sdk } = makeSdk({
        nodePages: [
          {
            items: [
              { properties: { cdf_cdm: { 'CogniteCADNode/v1': { name: 'x', treeIndexes: [1] } } } },
              nodeItem('empty', 'e', [], []),
              nodeItem('ok', 'o', [5], [1]),
            ],
          },
        ],
      });

      const nodes = await createThreeDContext(sdk, runNow).loadAssetNodes(MODEL_REF);

      expect(nodes.map((found) => found.name)).toEqual(['ok']);
    });

    it('goes through the limiter for every page', async () => {
      const schedule = vi.fn();

      schedule.mockImplementation((task: () => Promise<unknown>) => task());

      await createThreeDContext(
        makeSdk({
          nodePages: [{ items: [], nextCursor: 'c2' }, { items: [] }],
        }).sdk,
        { schedule: <Result>(task: () => Promise<Result>) => schedule(task) },
      ).loadAssetNodes(MODEL_REF);

      expect(schedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadSector', () => {
    it('downloads the file of a sector as bytes', async () => {
      const bytes = new ArrayBuffer(8);
      const { sdk, get } = makeSdk();

      get.mockResolvedValueOnce(response(bytes));

      await expect(createThreeDContext(sdk, runNow).loadSector(200, '157.glb')).resolves.toBe(
        bytes,
      );
      expect(get).toHaveBeenCalledWith('/api/v1/projects/flows-builder/3d/files/200/157.glb', {
        responseType: 'arraybuffer',
      });
    });
  });
});
