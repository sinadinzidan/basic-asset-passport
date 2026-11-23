import { BOX_HALF, FULL_TURN, THREE_D_DEFAULT_COLOR_COMPONENT } from '../../constants/threeD';
import { GeometryCollectionType } from '../../enums/geometryCollectionType';
import type { ParsedCollection, ParsedMesh, TessellatedMesh, Vector } from '../../types/threeD';

import { MeshBuilder } from './meshBuilder';
import { addEccentricCone, addEllipsoidSegment, addFrustum } from './shapes/parametric';
import { addAnnulusSector, addBox, addNut, addQuad, addTorusSegment } from './shapes/transformed';
import { cross, normalize, subtract, transformDirection, transformPoint } from './vectors';

const DEFAULT_COLOR: Vector = [
  THREE_D_DEFAULT_COLOR_COMPONENT,
  THREE_D_DEFAULT_COLOR_COMPONENT,
  THREE_D_DEFAULT_COLOR_COMPONENT,
];

const VECTOR_SIZE = 3;
const MATRIX_SIZE = 16;
const TRIANGLE_SIZE = 3;

const REQUIRED_ATTRIBUTES: Partial<Record<GeometryCollectionType, readonly string[]>> = {
  [GeometryCollectionType.BOX_COLLECTION]: ['instanceMatrix'],
  [GeometryCollectionType.QUAD_COLLECTION]: ['instanceMatrix'],
  [GeometryCollectionType.NUT_COLLECTION]: ['instanceMatrix'],
  [GeometryCollectionType.CIRCLE_COLLECTION]: ['instanceMatrix'],
  [GeometryCollectionType.GENERAL_RING_COLLECTION]: [
    'instanceMatrix',
    'angle',
    'arcAngle',
    'thickness',
  ],
  [GeometryCollectionType.TORUS_SEGMENT_COLLECTION]: [
    'instanceMatrix',
    'arcAngle',
    'radius',
    'tubeRadius',
  ],
  [GeometryCollectionType.CONE_COLLECTION]: [
    'centerA',
    'centerB',
    'radiusA',
    'radiusB',
    'localXAxis',
    'angle',
    'arcAngle',
  ],
  [GeometryCollectionType.GENERAL_CYLINDER_COLLECTION]: [
    'centerA',
    'centerB',
    'radius',
    'localXAxis',
    'angle',
    'arcAngle',
  ],
  [GeometryCollectionType.ECCENTRIC_CONE_COLLECTION]: [
    'centerA',
    'centerB',
    'radiusA',
    'radiusB',
    'normal',
  ],
  [GeometryCollectionType.ELLIPSOID_SEGMENT_COLLECTION]: [
    'center',
    'normal',
    'horizontalRadius',
    'verticalRadius',
    'height',
  ],
  [GeometryCollectionType.TRAPEZIUM_COLLECTION]: ['vertex1', 'vertex2', 'vertex3', 'vertex4'],
  [GeometryCollectionType.INSTANCE_MESH]: ['instanceMatrix'],
};

function scalarAt(collection: ParsedCollection, name: string, index: number): number {
  const attribute = collection.attributes[name];

  return attribute === undefined ? 0 : attribute.values[index * attribute.size];
}

function vectorAt(collection: ParsedCollection, name: string, index: number): Vector {
  const attribute = collection.attributes[name];

  if (attribute === undefined) return [0, 0, 0];

  const start = index * attribute.size;

  return [
    attribute.values[start],
    attribute.values[start + 1],
    attribute.values[start + VECTOR_SIZE - 1],
  ];
}

function matrixAt(collection: ParsedCollection, index: number): Float32Array {
  const attribute = collection.attributes.instanceMatrix;

  return attribute.values.subarray(index * MATRIX_SIZE, (index + 1) * MATRIX_SIZE);
}

function colorAt(collection: ParsedCollection, index: number): Vector {
  return collection.attributes.color === undefined
    ? DEFAULT_COLOR
    : vectorAt(collection, 'color', index);
}

function vertexNormals(mesh: ParsedMesh): Vector[] {
  const vertexCount = mesh.positions.length / VECTOR_SIZE;
  const sums = new Float32Array(vertexCount * VECTOR_SIZE);

  const positionAt = (vertex: number): Vector => [
    mesh.positions[vertex * VECTOR_SIZE],
    mesh.positions[vertex * VECTOR_SIZE + 1],
    mesh.positions[vertex * VECTOR_SIZE + VECTOR_SIZE - 1],
  ];

  for (let corner = 0; corner + TRIANGLE_SIZE <= mesh.indices.length; corner += TRIANGLE_SIZE) {
    const triangle = [
      mesh.indices[corner],
      mesh.indices[corner + 1],
      mesh.indices[corner + TRIANGLE_SIZE - 1],
    ];

    const [first, second, third] = triangle.map(positionAt);
    const faceNormal = cross(subtract(second, first), subtract(third, first));

    triangle.forEach((vertex) => {
      sums[vertex * VECTOR_SIZE] += faceNormal[0];
      sums[vertex * VECTOR_SIZE + 1] += faceNormal[1];
      sums[vertex * VECTOR_SIZE + VECTOR_SIZE - 1] += faceNormal[2];
    });
  }

  return Array.from({ length: vertexCount }, (_item, vertex) =>
    normalize([
      sums[vertex * VECTOR_SIZE],
      sums[vertex * VECTOR_SIZE + 1],
      sums[vertex * VECTOR_SIZE + VECTOR_SIZE - 1],
    ]),
  );
}

function addTriangleMesh(builder: MeshBuilder, collection: ParsedCollection): void {
  const { mesh } = collection;

  if (mesh === null) return;

  const base = builder.vertexCount;
  const normals = vertexNormals(mesh);

  normals.forEach((normal, vertex) => {
    const position: Vector = [
      mesh.positions[vertex * VECTOR_SIZE],
      mesh.positions[vertex * VECTOR_SIZE + 1],
      mesh.positions[vertex * VECTOR_SIZE + VECTOR_SIZE - 1],
    ];

    builder.setStyle(colorAt(collection, vertex), scalarAt(collection, 'treeIndex', vertex));
    builder.addVertex(position, normal);
  });

  for (let corner = 0; corner < mesh.indices.length; corner += TRIANGLE_SIZE) {
    builder.addTriangle(
      base + mesh.indices[corner],
      base + mesh.indices[corner + 1],
      base + mesh.indices[corner + TRIANGLE_SIZE - 1],
    );
  }
}

function addInstanceMesh(builder: MeshBuilder, collection: ParsedCollection): void {
  const { mesh } = collection;

  if (mesh === null) return;

  const normals = vertexNormals(mesh);

  for (let instance = 0; instance < collection.count; instance += 1) {
    const matrix = matrixAt(collection, instance);
    const base = builder.vertexCount;

    builder.setStyle(colorAt(collection, instance), scalarAt(collection, 'treeIndex', instance));

    normals.forEach((normal, vertex) => {
      const position: Vector = [
        mesh.positions[vertex * VECTOR_SIZE],
        mesh.positions[vertex * VECTOR_SIZE + 1],
        mesh.positions[vertex * VECTOR_SIZE + VECTOR_SIZE - 1],
      ];

      builder.addVertex(
        transformPoint(matrix, position),
        normalize(transformDirection(matrix, normal)),
      );
    });

    for (let corner = 0; corner < mesh.indices.length; corner += TRIANGLE_SIZE) {
      builder.addTriangle(
        base + mesh.indices[corner],
        base + mesh.indices[corner + 1],
        base + mesh.indices[corner + TRIANGLE_SIZE - 1],
      );
    }
  }
}

function addInstance(builder: MeshBuilder, collection: ParsedCollection, index: number): void {
  switch (collection.type) {
    case GeometryCollectionType.BOX_COLLECTION:
      addBox(builder, matrixAt(collection, index));
      break;
    case GeometryCollectionType.QUAD_COLLECTION:
      addQuad(builder, matrixAt(collection, index));
      break;
    case GeometryCollectionType.NUT_COLLECTION:
      addNut(builder, matrixAt(collection, index));
      break;
    case GeometryCollectionType.CIRCLE_COLLECTION:
      addAnnulusSector(builder, matrixAt(collection, index), 0, BOX_HALF, 0, FULL_TURN);
      break;
    case GeometryCollectionType.GENERAL_RING_COLLECTION:
      addAnnulusSector(
        builder,
        matrixAt(collection, index),
        BOX_HALF * (1 - scalarAt(collection, 'thickness', index)),
        BOX_HALF,
        scalarAt(collection, 'angle', index),
        scalarAt(collection, 'arcAngle', index),
      );

      break;
    case GeometryCollectionType.TORUS_SEGMENT_COLLECTION:
      addTorusSegment(
        builder,
        matrixAt(collection, index),
        scalarAt(collection, 'arcAngle', index),
        scalarAt(collection, 'radius', index),
        scalarAt(collection, 'tubeRadius', index),
      );

      break;
    case GeometryCollectionType.CONE_COLLECTION:
      addFrustum(builder, {
        centerA: vectorAt(collection, 'centerA', index),
        centerB: vectorAt(collection, 'centerB', index),
        radiusA: scalarAt(collection, 'radiusA', index),
        radiusB: scalarAt(collection, 'radiusB', index),
        localX: vectorAt(collection, 'localXAxis', index),
        startAngle: scalarAt(collection, 'angle', index),
        arcAngle: scalarAt(collection, 'arcAngle', index),
      });

      break;
    case GeometryCollectionType.GENERAL_CYLINDER_COLLECTION:
      addFrustum(builder, {
        centerA: vectorAt(collection, 'centerA', index),
        centerB: vectorAt(collection, 'centerB', index),
        radiusA: scalarAt(collection, 'radius', index),
        radiusB: scalarAt(collection, 'radius', index),
        localX: vectorAt(collection, 'localXAxis', index),
        startAngle: scalarAt(collection, 'angle', index),
        arcAngle: scalarAt(collection, 'arcAngle', index),
      });

      break;
    case GeometryCollectionType.ECCENTRIC_CONE_COLLECTION:
      addEccentricCone(builder, {
        centerA: vectorAt(collection, 'centerA', index),
        centerB: vectorAt(collection, 'centerB', index),
        radiusA: scalarAt(collection, 'radiusA', index),
        radiusB: scalarAt(collection, 'radiusB', index),
        normal: vectorAt(collection, 'normal', index),
      });

      break;
    case GeometryCollectionType.ELLIPSOID_SEGMENT_COLLECTION:
      addEllipsoidSegment(builder, {
        center: vectorAt(collection, 'center', index),
        normal: vectorAt(collection, 'normal', index),
        horizontalRadius: scalarAt(collection, 'horizontalRadius', index),
        verticalRadius: scalarAt(collection, 'verticalRadius', index),
        height: scalarAt(collection, 'height', index),
      });

      break;
    case GeometryCollectionType.TRAPEZIUM_COLLECTION:
      builder.addFlatPolygon([
        vectorAt(collection, 'vertex1', index),
        vectorAt(collection, 'vertex2', index),
        vectorAt(collection, 'vertex4', index),
        vectorAt(collection, 'vertex3', index),
      ]);

      break;
    default:
      break;
  }
}

function hasRequiredAttributes(collection: ParsedCollection): boolean {
  const required = REQUIRED_ATTRIBUTES[collection.type] ?? [];

  return required.every((name) => collection.attributes[name] !== undefined);
}

export function tessellateSector(collections: readonly ParsedCollection[]): TessellatedMesh {
  const builder = new MeshBuilder();
  const unsupported: Record<string, number> = {};

  for (const collection of collections) {
    const isMesh =
      collection.type === GeometryCollectionType.TRIANGLE_MESH ||
      collection.type === GeometryCollectionType.TEXTURED_TRIANGLE_MESH;

    if (isMesh) {
      addTriangleMesh(builder, collection);
    } else if (collection.type === GeometryCollectionType.INSTANCE_MESH) {
      if (hasRequiredAttributes(collection) && collection.mesh !== null) {
        addInstanceMesh(builder, collection);
      } else {
        unsupported[collection.type] = (unsupported[collection.type] ?? 0) + collection.count;
      }
    } else if (hasRequiredAttributes(collection)) {
      for (let index = 0; index < collection.count; index += 1) {
        builder.setStyle(colorAt(collection, index), scalarAt(collection, 'treeIndex', index));
        addInstance(builder, collection, index);
      }
    } else {
      unsupported[collection.type] = (unsupported[collection.type] ?? 0) + collection.count;
    }
  }

  return builder.build(unsupported);
}
