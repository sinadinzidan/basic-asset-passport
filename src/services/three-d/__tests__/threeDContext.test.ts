import type {
  CogniteClient,
  CursorAndAsyncIterator,
  HttpResponse,
  Model3D,
  Revision3D,
} from '@cognite/sdk';
import { describe, expect, it, vi } from 'vitest';

import { createThreeDContext, pickModel, pickRevision } from '../threeDContext';

type FakeSdk = Pick<CogniteClient, 'project' | 'get' | 'models3D' | 'revisions3D'>;

function makeModel(id: number, name: string): Model3D {
  return { id, name, createdTime: new Date(0) };
}

function makeRevision(id: number, overrides: Partial<Revision3D> = {}): Revision3D {
  return {
    id,
    fileId: 1,
    published: true,
    status: 'Done',
    createdTime: new Date(id * 1000),
    assetMappingCount: 0,
    ...overrides,
  };
}

function response(data: unknown): HttpResponse<never> {
  return { data } as Partial<HttpResponse<unknown>> as HttpResponse<never>;
}

function listing<Item>(items: Item[]): CursorAndAsyncIterator<Item> {
  return {
    autoPagingToArray: vi.fn(() => Promise.resolve(items)),
  } as Partial<CursorAndAsyncIterator<Item>> as CursorAndAsyncIterator<Item>;
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
    models?: Model3D[];
    revisions?: Revision3D[];
    outputs?: unknown;
    scene?: unknown;
  } = {},
) {
  const models = overrides.models ?? [makeModel(1, 'Other'), makeModel(7, 'Valhall')];
  const revisions = overrides.revisions ?? [
    makeRevision(1),
    makeRevision(2, { rotation: [1, 2, 3] }),
  ];
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
  const sdk = {
    project: 'flows-builder',
    get,
    models3D: { list: vi.fn(() => listing(models)) } as Partial<
      CogniteClient['models3D']
    > as CogniteClient['models3D'],
    revisions3D: { list: vi.fn(() => listing(revisions)) } as Partial<
      CogniteClient['revisions3D']
    > as CogniteClient['revisions3D'],
  } as Partial<CogniteClient> as FakeSdk;

  return { sdk, get };
}

const runNow = { schedule: <Result>(task: () => Promise<Result>) => task() };

describe(pickModel.name, () => {
  const models = [makeModel(1, 'Valhall Full'), makeModel(2, 'VALHALL '), makeModel(3, 'Other')];

  it('prefers a model named exactly like it, ignoring case and spaces', () => {
    expect(pickModel(models, 'valhall')?.id).toBe(2);
  });

  it('falls back to a model whose name contains it', () => {
    expect(pickModel(models.slice(0, 1), 'valhall')?.id).toBe(1);
  });

  it('finds nothing when no name matches', () => {
    expect(pickModel(models, 'ekofisk')).toBeUndefined();
  });
});

describe(pickRevision.name, () => {
  it('takes the newest revision that is published and ready', () => {
    const revisions = [makeRevision(1), makeRevision(3), makeRevision(2)];

    expect(pickRevision(revisions)?.id).toBe(3);
  });

  it('skips a revision that is not published or not done', () => {
    const revisions = [
      makeRevision(1),
      makeRevision(2, { published: false }),
      makeRevision(3, { status: 'Processing' }),
    ];

    expect(pickRevision(revisions)?.id).toBe(1);
  });

  it('finds nothing when no revision is ready', () => {
    expect(pickRevision([makeRevision(1, { status: 'Failed' })])).toBeUndefined();
  });
});

describe('createThreeDContext', () => {
  it('names its project', () => {
    expect(createThreeDContext(makeSdk().sdk, runNow).project).toBe('flows-builder');
  });

  describe('findModel', () => {
    it('finds the model by name, its newest ready revision, its newest glTF output and its scene', async () => {
      const { sdk, get } = makeSdk();

      const model = await createThreeDContext(sdk, runNow).findModel('Valhall');

      expect(model).toMatchObject({
        modelId: 7,
        revisionId: 2,
        name: 'Valhall',
        blobId: 200,
        rotation: [1, 2, 3],
        scale: null,
        translation: null,
      });
      expect(get).toHaveBeenCalledWith(
        '/api/v1/projects/flows-builder/3d/models/7/revisions/2/outputs',
        {
          params: { format: 'gltf-directory' },
        },
      );
      expect(get).toHaveBeenCalledWith('/api/v1/projects/flows-builder/3d/files/200/scene.json');
    });

    it('lists the sectors with a file, the coarsest first, and covers every box', async () => {
      const model = await createThreeDContext(makeSdk().sdk, runNow).findModel('Valhall');

      expect(model?.scene.sectors).toEqual([
        { id: 0, depth: 0, fileName: '0.glb', downloadSize: 10 },
        { id: 2, depth: 1, fileName: '2.glb', downloadSize: 20 },
      ]);
      expect(model?.scene.boundingBox).toEqual({ min: [-1, -2, -3], max: [10, 10, 10] });
      expect(model?.scene.unit).toBe('Meters');
    });

    it('returns nothing when the project has no such model', async () => {
      const { sdk } = makeSdk({ models: [makeModel(1, 'Other')] });

      await expect(createThreeDContext(sdk, runNow).findModel('Valhall')).resolves.toBeNull();
    });

    it('says so when the model has no revision that is ready', async () => {
      const { sdk } = makeSdk({ revisions: [makeRevision(1, { status: 'Processing' })] });

      await expect(createThreeDContext(sdk, runNow).findModel('Valhall')).rejects.toThrow(
        'The Valhall model has no published revision that is ready.',
      );
    });

    it('says so when the revision has no glTF output', async () => {
      const { sdk } = makeSdk({
        outputs: { items: [{ format: 'reveal-directory', version: 8, blobId: 5 }] },
      });

      await expect(createThreeDContext(sdk, runNow).findModel('Valhall')).rejects.toThrow(
        'The revision has no gltf-directory output to show.',
      );
    });

    it('refuses a scene file of a version it cannot read', async () => {
      const { sdk } = makeSdk({ scene: { ...SCENE_JSON, version: 8 } });

      await expect(createThreeDContext(sdk, runNow).findModel('Valhall')).rejects.toThrow();
    });

    it('goes through the limiter for every call it makes', async () => {
      const schedule = vi.fn();

      schedule.mockImplementation((task: () => Promise<unknown>) => task());

      await createThreeDContext(makeSdk().sdk, {
        schedule: <Result>(task: () => Promise<Result>) => schedule(task),
      }).findModel('Valhall');

      expect(schedule).toHaveBeenCalledTimes(4);
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
