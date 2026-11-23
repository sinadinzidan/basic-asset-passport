import type { CogniteClient } from '@cognite/sdk';

import { THREE_D_OUTPUT_FORMAT, THREE_D_SCENE_FILE_NAME } from '../../constants/threeD';
import { cdfTaskRunner } from '../../lib/queuedTaskRunner';
import { OutputsResponseSchema, SceneFileSchema, type SceneFile } from '../../schemas/threeD';
import type {
  ThreeDBox,
  ThreeDModel,
  ThreeDModelReference as ThreeDModelReference,
  ThreeDScene,
  ThreeDSector,
  Vector,
} from '../../types/threeD';
import type { ThreeDContextType } from '../../types/threeDContext';

type ThreeDSdk = Pick<CogniteClient, 'project' | 'get' | 'revisions3D'>;

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

  loadModel = async ({ name, modelId, revisionId }: ThreeDModelReference): Promise<ThreeDModel> => {
    const revision = await this.deps.schedule(() =>
      this.sdk.revisions3D.retrieve(modelId, revisionId),
    );

    if (revision.status !== READY_STATUS) {
      throw new Error(`The ${name} revision is not ready.`);
    }

    const blobId = await this.findOutputBlobId(modelId, revisionId);
    const scene = await this.loadScene(blobId);

    return {
      modelId,
      revisionId,
      name,
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
