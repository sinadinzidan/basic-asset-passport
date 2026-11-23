import type { CogniteClient, Model3D, Revision3D } from '@cognite/sdk';

import {
  THREE_D_MODEL_LIST_LIMIT,
  THREE_D_OUTPUT_FORMAT,
  THREE_D_REVISION_LIST_LIMIT,
  THREE_D_SCENE_FILE_NAME,
} from '../../constants/threeD';
import { cdfTaskRunner } from '../../lib/queuedTaskRunner';
import { OutputsResponseSchema, SceneFileSchema, type SceneFile } from '../../schemas/threeD';
import type { ThreeDBox, ThreeDModel, ThreeDScene, ThreeDSector, Vector } from '../../types/threeD';
import type { ThreeDContextType } from '../../types/threeDContext';

type ThreeDSdk = Pick<CogniteClient, 'project' | 'get' | 'models3D' | 'revisions3D'>;

type ThreeDDeps = {
  schedule: <Result>(task: () => Promise<Result>) => Promise<Result>;
};

const defaultDeps: ThreeDDeps = { schedule: (task) => cdfTaskRunner.schedule(task) };

const READY_STATUS = 'Done';

class CdfThreeDContext implements ThreeDContextType {
  constructor(
    private readonly sdk: ThreeDSdk,
    private readonly deps: ThreeDDeps,
  ) {}

  get project(): string {
    return this.sdk.project;
  }

  findModel = async (name: string): Promise<ThreeDModel | null> => {
    const models = await this.deps.schedule(() =>
      this.sdk.models3D
        .list({ limit: THREE_D_MODEL_LIST_LIMIT })
        .autoPagingToArray({ limit: THREE_D_MODEL_LIST_LIMIT }),
    );

    const model = pickModel(models, name);

    if (model === undefined) return null;

    const revisions = await this.deps.schedule(() =>
      this.sdk.revisions3D
        .list(model.id, { limit: THREE_D_REVISION_LIST_LIMIT })
        .autoPagingToArray({ limit: THREE_D_REVISION_LIST_LIMIT }),
    );

    const revision = pickRevision(revisions);

    if (revision === undefined) {
      throw new Error(`The ${model.name} model has no revision that is ready.`);
    }

    const blobId = await this.findOutputBlobId(model.id, revision.id);
    const scene = await this.loadScene(blobId);

    return {
      modelId: model.id,
      revisionId: revision.id,
      name: model.name,
      blobId,
      rotation: toVector(revision.rotation),
      scale: toVector(revision.scale),
      translation: toVector(revision.translation),
      scene,
    };
  };

  loadSector = async (blobId: number, fileName: string): Promise<ArrayBuffer> => {
    const response = await this.deps.schedule(() =>
      this.sdk.get<ArrayBuffer>(this.filePath(blobId, fileName), { responseType: 'arraybuffer' }),
    );

    return response.data;
  };

  private filePath(blobId: number, fileName?: string): string {
    const base = `/api/v1/projects/${this.sdk.project}/3d/files/${blobId}`;

    return fileName === undefined ? base : `${base}/${fileName}`;
  }

  private async findOutputBlobId(modelId: number, revisionId: number): Promise<number> {
    const response = await this.deps.schedule(() =>
      this.sdk.get<unknown>(
        `/api/v1/projects/${this.sdk.project}/3d/models/${modelId}/revisions/${revisionId}/outputs`,
        { params: { format: THREE_D_OUTPUT_FORMAT } },
      ),
    );

    const outputs = OutputsResponseSchema.parse(response.data).items.filter(
      (output) => output.format === THREE_D_OUTPUT_FORMAT,
    );

    const newest = outputs.reduce<(typeof outputs)[number] | undefined>(
      (best, output) => (best === undefined || output.version > best.version ? output : best),
      undefined,
    );

    if (newest === undefined) {
      throw new Error(`The revision has no ${THREE_D_OUTPUT_FORMAT} output to show.`);
    }

    return newest.blobId;
  }

  private async loadScene(blobId: number): Promise<ThreeDScene> {
    const response = await this.deps.schedule(() =>
      this.sdk.get<unknown>(this.filePath(blobId, THREE_D_SCENE_FILE_NAME)),
    );

    return toScene(SceneFileSchema.parse(response.data));
  }
}

export function createThreeDContext(
  sdk: ThreeDSdk,
  overrides?: Partial<ThreeDDeps>,
): ThreeDContextType {
  return new CdfThreeDContext(sdk, { ...defaultDeps, ...overrides });
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function pickModel(models: readonly Model3D[], name: string): Model3D | undefined {
  const wanted = normalizeName(name);

  return (
    models.find((model) => normalizeName(model.name) === wanted) ??
    models.find((model) => normalizeName(model.name).includes(wanted))
  );
}

export function pickRevision(revisions: readonly Revision3D[]): Revision3D | undefined {
  return revisions
    .filter((revision) => revision.status === READY_STATUS)
    .reduce<Revision3D | undefined>(
      (newest, revision) =>
        newest === undefined || revision.createdTime > newest.createdTime ? revision : newest,
      undefined,
    );
}

function toVector(values: readonly number[] | undefined): Vector | null {
  return values === undefined ? null : [values[0], values[1], values[values.length - 1]];
}

function toScene(file: SceneFile): ThreeDScene {
  const sectors: ThreeDSector[] = file.sectors
    .flatMap((sector) =>
      sector.sectorFileName
        ? [
            {
              id: sector.id,
              depth: sector.depth,
              fileName: sector.sectorFileName,
              downloadSize: sector.downloadSize ?? 0,
            },
          ]
        : [],
    )
    .sort((first, second) => first.depth - second.depth || first.id - second.id);

  return { unit: file.unit ?? 'Meters', sectors, boundingBox: unionOfBoxes(file) };
}

function unionOfBoxes(file: SceneFile): ThreeDBox {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  file.sectors.forEach(({ boundingBox }) => {
    min[0] = Math.min(min[0], boundingBox.min.x);
    min[1] = Math.min(min[1], boundingBox.min.y);
    min[2] = Math.min(min[2], boundingBox.min.z);
    max[0] = Math.max(max[0], boundingBox.max.x);
    max[1] = Math.max(max[1], boundingBox.max.y);
    max[2] = Math.max(max[2], boundingBox.max.z);
  });

  return { min, max };
}
