import { describe, expect, it } from 'vitest';

import { IDENTITY_MATRIX, makeGlb, translationMatrix } from '../../../__mocks__/glb';
import { GeometryCollectionType } from '../../../enums/geometryCollectionType';
import { parseGlbContainer } from '../glbContainer';
import { parseSector } from '../sectorParser';

const boxNode = {
  kind: 'instanced',
  name: 'BoxCollection',
  attributes: {
    _treeIndex: { size: 1, values: [4, 9] },
    _color: { size: 3, values: [1, 0, 0, 0, 1, 0] },
    _instanceMatrix: { size: 16, values: [...IDENTITY_MATRIX, ...translationMatrix(5, 6, 7)] },
  },
} as const;

describe(parseGlbContainer.name, () => {
  it('reads the header, the JSON chunk and where the binary data starts', () => {
    const container = parseGlbContainer(makeGlb([boxNode]));

    expect(container.json.nodes[0]?.name).toBe('BoxCollection');
    expect(container.binaryOffset).toBeGreaterThan(0);
  });

  it('refuses a file that is not a GLB file', () => {
    const notGlb = new TextEncoder().encode('not a glb file at all, just some text.').buffer;

    expect(() => parseGlbContainer(notGlb)).toThrow('The file is not a GLB file.');
  });

  it('refuses a file that is too short', () => {
    expect(() => parseGlbContainer(new ArrayBuffer(4))).toThrow(
      'The file is too short to be a GLB file.',
    );
  });

  it('refuses another glTF version', () => {
    const file = makeGlb([boxNode]);

    new DataView(file).setUint32(4, 1, true);

    expect(() => parseGlbContainer(file)).toThrow('Only glTF version 2 is supported.');
  });
});

describe(parseSector.name, () => {
  it('reads an instanced collection with the attribute names Cognite uses, without their underscore', () => {
    const [collection] = parseSector(makeGlb([boxNode]));

    expect(collection.type).toBe(GeometryCollectionType.BOX_COLLECTION);
    expect(collection.count).toBe(2);
    expect(Object.keys(collection.attributes).sort()).toEqual([
      'color',
      'instanceMatrix',
      'treeIndex',
    ]);
    expect(Array.from(collection.attributes.treeIndex.values)).toEqual([4, 9]);
    expect(Array.from(collection.attributes.color.values)).toEqual([1, 0, 0, 0, 1, 0]);
    expect(Array.from(collection.attributes.instanceMatrix.values.slice(16 + 12, 16 + 15))).toEqual(
      [5, 6, 7],
    );
  });

  it('reads attributes that share one interleaved buffer without mixing them up', () => {
    const [collection] = parseSector(
      makeGlb([
        {
          kind: 'instanced',
          name: 'ConeCollection',
          attributes: {
            _treeIndex: { size: 1, values: [1, 2, 3] },
            _centerA: { size: 3, values: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
            _radiusA: { size: 1, values: [0.5, 0.6, 0.7] },
          },
        },
      ]),
    );

    expect(Array.from(collection.attributes.centerA.values)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(
      Array.from(collection.attributes.radiusA.values).map((value) => Number(value.toFixed(1))),
    ).toEqual([0.5, 0.6, 0.7]);
    expect(Array.from(collection.attributes.treeIndex.values)).toEqual([1, 2, 3]);
  });

  it('reads a triangle mesh with its indices, colours and tree indices', () => {
    const [collection] = parseSector(
      makeGlb([
        {
          kind: 'mesh',
          name: 'TriangleMesh',
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          indices: [0, 1, 2],
          colors: [1, 0, 0, 1, 0, 0, 1, 0, 0],
          treeIndices: [7, 7, 7],
        },
      ]),
    );

    expect(collection.type).toBe(GeometryCollectionType.TRIANGLE_MESH);
    expect(collection.count).toBe(3);
    expect(Array.from(collection.mesh?.indices ?? [])).toEqual([0, 1, 2]);
    expect(Array.from(collection.attributes.treeIndex.values)).toEqual([7, 7, 7]);
    expect(collection.attributes.color.size).toBe(3);
  });

  it('reads an instance mesh with its template and its instances', () => {
    const [collection] = parseSector(
      makeGlb([
        {
          kind: 'instanceMesh',
          name: 'InstanceMesh',
          positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
          indices: [0, 1, 2],
          attributes: {
            _treeIndex: { size: 1, values: [3] },
            _color: { size: 3, values: [0, 0, 1] },
            _instanceMatrix: { size: 16, values: [...IDENTITY_MATRIX] },
          },
        },
      ]),
    );

    expect(collection.type).toBe(GeometryCollectionType.INSTANCE_MESH);
    expect(collection.count).toBe(1);
    expect(collection.mesh?.positions.length).toBe(9);
  });

  it('skips a node that is not a geometry collection Cognite defines', () => {
    const collections = parseSector(
      makeGlb([
        {
          kind: 'instanced',
          name: 'SomethingElse',
          attributes: { _treeIndex: { size: 1, values: [1] } },
        },
        boxNode,
      ]),
    );

    expect(collections.map((collection) => collection.type)).toEqual([
      GeometryCollectionType.BOX_COLLECTION,
    ]);
  });
});
