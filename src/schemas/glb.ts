import { z } from 'zod';

const AccessorSchema = z.object({
  bufferView: z.number(),
  byteOffset: z.number().optional(),
  componentType: z.number(),
  count: z.number(),
  type: z.string(),
  normalized: z.boolean().optional(),
});

const BufferViewSchema = z.object({
  byteLength: z.number(),
  byteOffset: z.number().optional(),
  byteStride: z.number().optional(),
});

const NodeSchema = z.object({
  name: z.string().optional(),
  mesh: z.number().optional(),
  extensions: z
    .object({
      EXT_mesh_gpu_instancing: z
        .object({ attributes: z.record(z.string(), z.number()) })
        .optional(),
    })
    .optional(),
});

const PrimitiveSchema = z.object({
  attributes: z.record(z.string(), z.number()),
  indices: z.number().optional(),
});

const MeshSchema = z.object({
  primitives: z.array(PrimitiveSchema),
});

export const GltfJsonSchema = z.object({
  accessors: z.array(AccessorSchema).default([]),
  bufferViews: z.array(BufferViewSchema).default([]),
  nodes: z.array(NodeSchema).default([]),
  meshes: z.array(MeshSchema).default([]),
  scene: z.number().default(0),
  scenes: z.array(z.object({ nodes: z.array(z.number()).default([]) })).default([]),
});

export type GltfJson = z.infer<typeof GltfJsonSchema>;
export type GltfAccessor = z.infer<typeof AccessorSchema>;
