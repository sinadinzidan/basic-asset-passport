import { describe, expect, it } from 'vitest';

import {
  IDENTITY_MATRIX,
  makeGlb,
  scaleMatrix,
  translationMatrix,
  type FixtureAttribute,
  type FixtureNode,
} from '../../../__mocks__/glb';
import type { TessellatedMesh } from '../../../types/threeD';
import { parseSector } from '../sectorParser';
import { tessellateSector } from '../tessellateSector';

type Bounds = { min: number[]; max: number[] };

function tessellate(nodes: readonly FixtureNode[]): TessellatedMesh {
  return tessellateSector(parseSector(makeGlb(nodes)));
}

function boundsOf(mesh: TessellatedMesh): Bounds {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (let vertex = 0; vertex < mesh.positions.length / 3; vertex += 1) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = mesh.positions[vertex * 3 + axis];

      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }

  return { min, max };
}

function expectBounds(mesh: TessellatedMesh, min: number[], max: number[]): void {
  const bounds = boundsOf(mesh);

  min.forEach((value, axis) => expect(bounds.min[axis]).toBeCloseTo(value, 4));
  max.forEach((value, axis) => expect(bounds.max[axis]).toBeCloseTo(value, 4));
}

function instanced(
  name: string,
  attributes: Record<string, FixtureAttribute>,
  treeIndex = 1,
  color = [0.2, 0.4, 0.6],
): FixtureNode {
  return {
    kind: 'instanced',
    name,
    attributes: {
      _treeIndex: { size: 1, values: [treeIndex] },
      _color: { size: 3, values: color },
      ...attributes,
    },
  };
}

function matrix(values: readonly number[]): FixtureAttribute {
  return { size: 16, values };
}

function scalar(value: number): FixtureAttribute {
  return { size: 1, values: [value] };
}

function vector(first: number, second: number, third: number): FixtureAttribute {
  return { size: 3, values: [first, second, third] };
}

function triangleCount(mesh: TessellatedMesh): number {
  return mesh.indices.length / 3;
}

function normalLengths(mesh: TessellatedMesh): number[] {
  return Array.from({ length: mesh.normals.length / 3 }, (_item, vertex) =>
    Math.hypot(
      mesh.normals[vertex * 3],
      mesh.normals[vertex * 3 + 1],
      mesh.normals[vertex * 3 + 2],
    ),
  );
}

describe(tessellateSector.name, () => {
  it('turns a box into six flat faces covering the unit cube', () => {
    const mesh = tessellate([
      instanced('BoxCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }),
    ]);

    expect(mesh.positions.length / 3).toBe(24);
    expect(triangleCount(mesh)).toBe(12);
    expectBounds(mesh, [-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]);
  });

  it('places a box by its instance matrix: scaled, then moved', () => {
    const scaled = scaleMatrix(2, 4, 6);
    const moved = [...scaled.slice(0, 12), 10, 20, 30, 1];

    const mesh = tessellate([instanced('BoxCollection', { _instanceMatrix: matrix(moved) })]);

    expectBounds(mesh, [9, 18, 27], [11, 22, 33]);
  });

  it('gives every vertex of a box the colour and tree index of its instance', () => {
    const mesh = tessellate([
      instanced('BoxCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }, 42, [0.1, 0.2, 0.3]),
    ]);

    expect(new Set(mesh.treeIndices)).toEqual(new Set([42]));
    expect(Array.from(mesh.colors.slice(0, 3)).map((value) => Number(value.toFixed(1)))).toEqual([
      0.1, 0.2, 0.3,
    ]);
  });

  it('keeps the colour and tree index of each instance apart', () => {
    const mesh = tessellate([
      {
        kind: 'instanced',
        name: 'BoxCollection',
        attributes: {
          _treeIndex: { size: 1, values: [1, 2] },
          _color: { size: 3, values: [1, 0, 0, 0, 1, 0] },
          _instanceMatrix: matrix([...IDENTITY_MATRIX, ...translationMatrix(5, 0, 0)]),
        },
      },
    ]);

    expect(Array.from(new Set(mesh.treeIndices))).toEqual([1, 2]);
    expect(mesh.colors[0]).toBe(1);
    expect(mesh.colors[24 * 3 + 1]).toBe(1);
    expectBounds(mesh, [-0.5, -0.5, -0.5], [5.5, 0.5, 0.5]);
  });

  it('gives flat faces unit normals that point away from the box', () => {
    const mesh = tessellate([
      instanced('BoxCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }),
    ]);

    normalLengths(mesh).forEach((length) => expect(length).toBeCloseTo(1, 5));

    for (let vertex = 0; vertex < 24; vertex += 1) {
      const position = [0, 1, 2].map((axis) => mesh.positions[vertex * 3 + axis]);
      const normal = [0, 1, 2].map((axis) => mesh.normals[vertex * 3 + axis]);

      expect(position.reduce((sum, value, axis) => sum + value * normal[axis], 0)).toBeGreaterThan(
        0,
      );
    }
  });

  it('turns a quad into one flat square in the plane of its matrix', () => {
    const mesh = tessellate([
      instanced('QuadCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }),
    ]);

    expect(mesh.positions.length / 3).toBe(4);
    expect(triangleCount(mesh)).toBe(2);
    expectBounds(mesh, [-0.5, -0.5, 0], [0.5, 0.5, 0]);
  });

  it('turns a nut into a hexagonal prism', () => {
    const mesh = tessellate([
      instanced('NutCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }),
    ]);

    expect(mesh.positions.length / 3).toBe(6 * 4 + 2 * 6);
    expect(boundsOf(mesh).min[2]).toBeCloseTo(-0.5, 5);
    expect(boundsOf(mesh).max[2]).toBeCloseTo(0.5, 5);
  });

  it('turns a circle into a disc of radius one half', () => {
    const mesh = tessellate([
      instanced('CircleCollection', {
        _instanceMatrix: matrix(IDENTITY_MATRIX),
        _normal: vector(0, 0, 1),
      }),
    ]);

    expectBounds(mesh, [-0.5, -0.5, 0], [0.5, 0.5, 0]);
  });

  it('cuts a ring to its arc and its thickness', () => {
    const mesh = tessellate([
      instanced('GeneralRingCollection', {
        _instanceMatrix: matrix(IDENTITY_MATRIX),
        _normal: vector(0, 0, 1),
        _angle: scalar(0),
        _arcAngle: scalar(Math.PI / 2),
        _thickness: scalar(0.5),
      }),
    ]);

    expectBounds(mesh, [0, 0, 0], [0.5, 0.5, 0]);

    for (let vertex = 0; vertex < mesh.positions.length / 3; vertex += 1) {
      const distance = Math.hypot(mesh.positions[vertex * 3], mesh.positions[vertex * 3 + 1]);

      expect(distance).toBeGreaterThanOrEqual(0.25 - 1e-5);
      expect(distance).toBeLessThanOrEqual(0.5 + 1e-5);
    }
  });

  it('bends a torus segment along its arc with the radius of its tube', () => {
    const mesh = tessellate([
      instanced('TorusSegmentCollection', {
        _instanceMatrix: matrix(IDENTITY_MATRIX),
        _arcAngle: scalar(Math.PI / 2),
        _radius: scalar(2),
        _tubeRadius: scalar(0.5),
      }),
    ]);

    const bounds = boundsOf(mesh);

    expect(bounds.max[0]).toBeCloseTo(2.5, 4);
    expect(bounds.max[1]).toBeCloseTo(2.5, 4);
    expect(bounds.min[0]).toBeGreaterThanOrEqual(-1e-5);
    expect(bounds.max[2]).toBeCloseTo(0.5, 4);
    expect(bounds.min[2]).toBeCloseTo(-0.5, 4);
  });

  it('builds a cylinder between its two centres with caps, and radial normals on its side', () => {
    const mesh = tessellate([
      instanced('GeneralCylinderCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(0, 0, 4),
        _radius: scalar(1),
        _localXAxis: vector(1, 0, 0),
        _angle: scalar(0),
        _arcAngle: scalar(2 * Math.PI),
        _planeA: { size: 4, values: [0, 0, 1, 0] },
        _planeB: { size: 4, values: [0, 0, 1, 0] },
      }),
    ]);

    expectBounds(mesh, [-1, -1, 0], [1, 1, 4]);
    normalLengths(mesh).forEach((length) => expect(length).toBeCloseTo(1, 5));
    expect(triangleCount(mesh)).toBeGreaterThan(20);
  });

  it('builds a cylinder along any axis', () => {
    const mesh = tessellate([
      instanced('GeneralCylinderCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(3, 0, 0),
        _radius: scalar(0.5),
        _localXAxis: vector(0, 1, 0),
        _angle: scalar(0),
        _arcAngle: scalar(2 * Math.PI),
      }),
    ]);

    expectBounds(mesh, [0, -0.5, -0.5], [3, 0.5, 0.5]);
  });

  it('leaves a partial cylinder open and without caps', () => {
    const full = tessellate([
      instanced('GeneralCylinderCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(0, 0, 1),
        _radius: scalar(1),
        _localXAxis: vector(1, 0, 0),
        _angle: scalar(0),
        _arcAngle: scalar(2 * Math.PI),
      }),
    ]);
    const half = tessellate([
      instanced('GeneralCylinderCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(0, 0, 1),
        _radius: scalar(1),
        _localXAxis: vector(1, 0, 0),
        _angle: scalar(0),
        _arcAngle: scalar(Math.PI),
      }),
    ]);

    expect(triangleCount(half)).toBeLessThan(triangleCount(full) / 2);
    expect(boundsOf(half).min[1]).toBeGreaterThanOrEqual(-1e-5);
  });

  it('builds a cone that narrows from one end to the other', () => {
    const mesh = tessellate([
      instanced('ConeCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(0, 0, 2),
        _radiusA: scalar(2),
        _radiusB: scalar(1),
        _localXAxis: vector(1, 0, 0),
        _angle: scalar(0),
        _arcAngle: scalar(2 * Math.PI),
      }),
    ]);

    expectBounds(mesh, [-2, -2, 0], [2, 2, 2]);
  });

  it('builds an eccentric cone whose ends are not above each other', () => {
    const mesh = tessellate([
      instanced('EccentricConeCollection', {
        _centerA: vector(0, 0, 0),
        _centerB: vector(3, 0, 2),
        _radiusA: scalar(1),
        _radiusB: scalar(0.5),
        _normal: vector(0, 0, 1),
      }),
    ]);

    expectBounds(mesh, [-1, -1, 0], [3.5, 1, 2]);
  });

  it('builds the cap of an ellipsoid between its pole and its cutting plane', () => {
    const mesh = tessellate([
      instanced('EllipsoidSegmentCollection', {
        _center: vector(0, 0, 0),
        _normal: vector(0, 0, 1),
        _horizontalRadius: scalar(2),
        _verticalRadius: scalar(3),
        _height: scalar(1),
      }),
    ]);

    const bounds = boundsOf(mesh);

    expect(bounds.max[2]).toBeCloseTo(3, 4);
    expect(bounds.min[2]).toBeCloseTo(2, 4);
    expect(bounds.max[0]).toBeCloseTo(2 * Math.sin(Math.acos(2 / 3)), 2);
    normalLengths(mesh).forEach((length) => expect(length).toBeCloseTo(1, 4));
  });

  it('draws nothing for an ellipsoid with no height', () => {
    const mesh = tessellate([
      instanced('EllipsoidSegmentCollection', {
        _center: vector(0, 0, 0),
        _normal: vector(0, 0, 1),
        _horizontalRadius: scalar(2),
        _verticalRadius: scalar(3),
        _height: scalar(0),
      }),
    ]);

    expect(mesh.positions.length).toBe(0);
  });

  it('turns a trapezium into two triangles over its four corners', () => {
    const mesh = tessellate([
      instanced('TrapeziumCollection', {
        _vertex1: vector(0, 0, 0),
        _vertex2: vector(2, 0, 0),
        _vertex3: vector(0, 1, 0),
        _vertex4: vector(2, 1, 0),
      }),
    ]);

    expect(mesh.positions.length / 3).toBe(4);
    expect(triangleCount(mesh)).toBe(2);
    expectBounds(mesh, [0, 0, 0], [2, 1, 0]);
  });

  it('keeps a triangle mesh as it is, with normals from its faces and its own colours', () => {
    const mesh = tessellate([
      {
        kind: 'mesh',
        name: 'TriangleMesh',
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        indices: [0, 1, 2],
        colors: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        treeIndices: [5, 5, 6],
      },
    ]);

    expect(triangleCount(mesh)).toBe(1);
    expect(Array.from(mesh.normals.slice(0, 3))).toEqual([0, 0, 1]);
    expect(Array.from(mesh.treeIndices)).toEqual([5, 5, 6]);
    expect(Array.from(mesh.colors.slice(3, 6))).toEqual([0, 1, 0]);
  });

  it('draws an instance mesh once for every instance, each placed by its matrix', () => {
    const mesh = tessellate([
      {
        kind: 'instanceMesh',
        name: 'InstanceMesh',
        positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
        indices: [0, 1, 2],
        attributes: {
          _treeIndex: { size: 1, values: [1, 2] },
          _color: { size: 3, values: [1, 0, 0, 0, 1, 0] },
          _instanceMatrix: matrix([...IDENTITY_MATRIX, ...translationMatrix(10, 0, 0)]),
        },
      },
    ]);

    expect(mesh.positions.length / 3).toBe(6);
    expect(triangleCount(mesh)).toBe(2);
    expect(Array.from(mesh.treeIndices)).toEqual([1, 1, 1, 2, 2, 2]);
    expectBounds(mesh, [0, 0, 0], [11, 1, 0]);
  });

  it('counts a collection it cannot build instead of failing the whole sector', () => {
    const mesh = tessellate([
      instanced('ConeCollection', { _centerA: vector(0, 0, 0) }),
      instanced('BoxCollection', { _instanceMatrix: matrix(IDENTITY_MATRIX) }),
    ]);

    expect(mesh.unsupported).toEqual({ CONE_COLLECTION: 1 });
    expect(triangleCount(mesh)).toBe(12);
  });

  it('gives an empty mesh for an empty sector', () => {
    expect(tessellateSector([]).indices.length).toBe(0);
  });
});
