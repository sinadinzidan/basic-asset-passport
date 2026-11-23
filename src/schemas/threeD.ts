import { z } from 'zod';

import { THREE_D_SUPPORTED_SCENE_VERSION } from '../constants/threeD';

const PointSchema = z.object({ x: z.number(), y: z.number(), z: z.number() });

const BoxSchema = z.object({ min: PointSchema, max: PointSchema });

export const OutputsResponseSchema = z.object({
  items: z.array(z.object({ format: z.string(), version: z.number(), blobId: z.number() })),
});

export const SceneFileSchema = z.object({
  version: z.literal(THREE_D_SUPPORTED_SCENE_VERSION),
  unit: z.string().nullish(),
  sectors: z
    .array(
      z.object({
        id: z.number(),
        depth: z.number().default(0),
        boundingBox: BoxSchema,
        sectorFileName: z.string().nullish(),
        downloadSize: z.number().nullish(),
      }),
    )
    .min(1),
});

export type SceneFile = z.infer<typeof SceneFileSchema>;
