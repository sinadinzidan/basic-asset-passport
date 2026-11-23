import { GeometryCollectionType } from '../../enums/geometryCollectionType';
import type { GltfJson } from '../../schemas/glb';
import type { ParsedAttribute, ParsedCollection, ParsedMesh } from '../../types/threeD';

import { readAccessor, readIndices } from './glbAccessors';
import { parseGlbContainer, type GlbContainer } from './glbContainer';

const VERTEX_SIZE = 3;
const MESH_POSITION = 'POSITION';
const MESH_COLOR = 'COLOR_0';
const MESH_TREE_INDEX = '_treeIndex';
const INSTANCE_ATTRIBUTE_PREFIX = '_';

const COLLECTION_TYPE_BY_NODE_NAME: ReadonlyMap<string, GeometryCollectionType> = new Map([
  ['BoxCollection', GeometryCollectionType.BOX_COLLECTION],
  ['CircleCollection', GeometryCollectionType.CIRCLE_COLLECTION],
  ['ConeCollection', GeometryCollectionType.CONE_COLLECTION],
  ['EccentricConeCollection', GeometryCollectionType.ECCENTRIC_CONE_COLLECTION],
  ['EllipsoidSegmentCollection', GeometryCollectionType.ELLIPSOID_SEGMENT_COLLECTION],
  ['GeneralCylinderCollection', GeometryCollectionType.GENERAL_CYLINDER_COLLECTION],
  ['GeneralRingCollection', GeometryCollectionType.GENERAL_RING_COLLECTION],
  ['QuadCollection', GeometryCollectionType.QUAD_COLLECTION],
  ['TorusSegmentCollection', GeometryCollectionType.TORUS_SEGMENT_COLLECTION],
  ['TrapeziumCollection', GeometryCollectionType.TRAPEZIUM_COLLECTION],
  ['NutCollection', GeometryCollectionType.NUT_COLLECTION],
  ['TriangleMesh', GeometryCollectionType.TRIANGLE_MESH],
  ['TexturedTriangleMesh', GeometryCollectionType.TEXTURED_TRIANGLE_MESH],
  ['InstanceMesh', GeometryCollectionType.INSTANCE_MESH],
]);

function publicName(attributeName: string): string {
  return attributeName.startsWith(INSTANCE_ATTRIBUTE_PREFIX)
    ? attributeName.slice(INSTANCE_ATTRIBUTE_PREFIX.length)
    : attributeName;
}

function isColorName(attributeName: string): boolean {
  return publicName(attributeName).toLowerCase().startsWith('color');
}

function readAttributes(
  container: GlbContainer,
  accessors: Readonly<Record<string, number>>,
): Record<string, ParsedAttribute> {
  const attributes: Record<string, ParsedAttribute> = {};

  for (const [attributeName, accessorIndex] of Object.entries(accessors)) {
    attributes[publicName(attributeName)] = readAccessor(
      container,
      accessorIndex,
      isColorName(attributeName),
    );
  }

  return attributes;
}

function elementCount(attributes: Readonly<Record<string, ParsedAttribute>>): number {
  const [first] = Object.values(attributes);

  return first === undefined ? 0 : first.values.length / first.size;
}

function readMesh(
  container: GlbContainer,
  json: GltfJson,
  meshIndex: number,
): { mesh: ParsedMesh; attributes: Record<string, ParsedAttribute> } | null {
  const primitive = json.meshes[meshIndex]?.primitives[0];

  if (primitive === undefined || primitive.indices === undefined) return null;

  const positionAccessor = primitive.attributes[MESH_POSITION];

  if (positionAccessor === undefined) return null;

  const meshAttributes: Record<string, ParsedAttribute> = {};
  const colorAccessor = primitive.attributes[MESH_COLOR];
  const treeIndexAccessor = primitive.attributes[MESH_TREE_INDEX];

  if (colorAccessor !== undefined)
    meshAttributes.color = readAccessor(container, colorAccessor, true);

  if (treeIndexAccessor !== undefined)
    meshAttributes.treeIndex = readAccessor(container, treeIndexAccessor);

  return {
    mesh: {
      positions: readAccessor(container, positionAccessor).values,
      indices: readIndices(container, primitive.indices),
    },
    attributes: meshAttributes,
  };
}

function parseNode(container: GlbContainer, nodeIndex: number): ParsedCollection | null {
  const node = container.json.nodes[nodeIndex];

  const type = node?.name === undefined ? undefined : COLLECTION_TYPE_BY_NODE_NAME.get(node.name);

  if (node === undefined || type === undefined) return null;

  const instancing = node.extensions?.EXT_mesh_gpu_instancing;

  if (instancing !== undefined) {
    const attributes = readAttributes(container, instancing.attributes);

    const mesh =
      node.mesh === undefined
        ? null
        : (readMesh(container, container.json, node.mesh)?.mesh ?? null);

    return { type, count: elementCount(attributes), attributes, mesh };
  }

  if (node.mesh === undefined) return null;

  const meshData = readMesh(container, container.json, node.mesh);

  if (meshData === null) return null;

  return {
    type,
    count: meshData.mesh.positions.length / VERTEX_SIZE,
    attributes: meshData.attributes,
    mesh: meshData.mesh,
  };
}

export function parseSector(buffer: ArrayBuffer): ParsedCollection[] {
  const container = parseGlbContainer(buffer);
  const nodeIndices = container.json.scenes[container.json.scene]?.nodes ?? [];

  return nodeIndices.flatMap((nodeIndex) => {
    const collection = parseNode(container, nodeIndex);

    return collection === null ? [] : [collection];
  });
}
