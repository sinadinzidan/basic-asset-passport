const FLOAT = 5126;
const UNSIGNED_INT = 5125;
const FLOAT_BYTES = 4;
const ALIGNMENT = 4;
const GLB_VERSION = 2;
const HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const JSON_CHUNK = 0x4e_4f_53_4a;
const BINARY_CHUNK = 0x00_4e_49_42;
const MAGIC = 0x46_54_6c_67;

const TYPE_BY_SIZE: Readonly<Record<number, string>> = {
  1: 'SCALAR',
  2: 'VEC2',
  3: 'VEC3',
  4: 'VEC4',
  16: 'MAT4',
};

export type FixtureAttribute = {
  size: number;
  values: readonly number[];
};

export type FixtureNode =
  | { kind: 'instanced'; name: string; attributes: Readonly<Record<string, FixtureAttribute>> }
  | {
      kind: 'mesh';
      name: string;
      positions: readonly number[];
      indices: readonly number[];
      colors?: readonly number[];
      treeIndices?: readonly number[];
    }
  | {
      kind: 'instanceMesh';
      name: string;
      positions: readonly number[];
      indices: readonly number[];
      attributes: Readonly<Record<string, FixtureAttribute>>;
    };

type Accessor = {
  bufferView: number;
  byteOffset: number;
  componentType: number;
  count: number;
  type: string;
};

type BufferView = {
  byteOffset: number;
  byteLength: number;
  byteStride?: number;
};

class GlbWriter {
  readonly accessors: Accessor[] = [];

  readonly bufferViews: BufferView[] = [];

  readonly nodes: Record<string, unknown>[] = [];

  readonly meshes: Record<string, unknown>[] = [];

  private readonly chunks: ArrayBuffer[] = [];

  private binaryLength = 0;

  private append(bytes: ArrayBuffer): number {
    const offset = this.binaryLength;
    const padded = Math.ceil(bytes.byteLength / ALIGNMENT) * ALIGNMENT;
    const copy = new Uint8Array(padded);

    copy.set(new Uint8Array(bytes));
    this.chunks.push(copy.buffer);
    this.binaryLength += padded;

    return offset;
  }

  addInterleaved(attributes: readonly [string, FixtureAttribute][]): Record<string, number> {
    const stride = attributes.reduce(
      (total, [, attribute]) => total + attribute.size * FLOAT_BYTES,
      0,
    );

    const count = attributes[0][1].values.length / attributes[0][1].size;
    const data = new DataView(new ArrayBuffer(stride * count));
    const view = this.bufferViews.length;
    const accessors: Record<string, number> = {};
    let offset = 0;

    attributes.forEach(([name, attribute]) => {
      for (let element = 0; element < count; element += 1) {
        for (let component = 0; component < attribute.size; component += 1) {
          data.setFloat32(
            element * stride + offset + component * FLOAT_BYTES,
            attribute.values[element * attribute.size + component],
            true,
          );
        }
      }

      accessors[name] = this.accessors.length;

      this.accessors.push({
        bufferView: view,
        byteOffset: offset,
        componentType: FLOAT,
        count,
        type: TYPE_BY_SIZE[attribute.size],
      });

      offset += attribute.size * FLOAT_BYTES;
    });

    this.bufferViews.push({
      byteOffset: this.append(data.buffer),
      byteLength: stride * count,
      byteStride: stride,
    });

    return accessors;
  }

  addIndices(indices: readonly number[]): number {
    const data = new Uint32Array(indices);
    const view = this.bufferViews.length;

    this.bufferViews.push({ byteOffset: this.append(data.buffer), byteLength: data.byteLength });

    this.accessors.push({
      bufferView: view,
      byteOffset: 0,
      componentType: UNSIGNED_INT,
      count: indices.length,
      type: 'SCALAR',
    });

    return this.accessors.length - 1;
  }

  addMesh(
    positions: readonly number[],
    indices: readonly number[],
    extra: [string, FixtureAttribute][] = [],
  ): number {
    const vertexAccessors = this.addInterleaved([
      ['POSITION', { size: 3, values: positions }],
      ...extra,
    ]);

    const indexAccessor = this.addIndices(indices);

    this.meshes.push({ primitives: [{ attributes: vertexAccessors, indices: indexAccessor }] });

    return this.meshes.length - 1;
  }

  finish(): ArrayBuffer {
    const json = new TextEncoder().encode(
      JSON.stringify({
        accessors: this.accessors,
        bufferViews: this.bufferViews.map((view) => ({ buffer: 0, ...view })),
        nodes: this.nodes,
        meshes: this.meshes,
        scene: 0,
        scenes: [{ nodes: this.nodes.map((_node, index) => index) }],
      }),
    );

    const jsonLength = Math.ceil(json.byteLength / ALIGNMENT) * ALIGNMENT;

    const total =
      HEADER_BYTES + CHUNK_HEADER_BYTES + jsonLength + CHUNK_HEADER_BYTES + this.binaryLength;

    const file = new ArrayBuffer(total);
    const view = new DataView(file);
    const bytes = new Uint8Array(file);

    view.setUint32(0, MAGIC, true);
    view.setUint32(ALIGNMENT, GLB_VERSION, true);
    view.setUint32(CHUNK_HEADER_BYTES, total, true);
    view.setUint32(HEADER_BYTES, jsonLength, true);
    view.setUint32(HEADER_BYTES + ALIGNMENT, JSON_CHUNK, true);

    bytes.fill(
      0x20,
      HEADER_BYTES + CHUNK_HEADER_BYTES,
      HEADER_BYTES + CHUNK_HEADER_BYTES + jsonLength,
    );

    bytes.set(json, HEADER_BYTES + CHUNK_HEADER_BYTES);

    const binaryStart = HEADER_BYTES + CHUNK_HEADER_BYTES + jsonLength;

    view.setUint32(binaryStart, this.binaryLength, true);
    view.setUint32(binaryStart + ALIGNMENT, BINARY_CHUNK, true);

    let offset = binaryStart + CHUNK_HEADER_BYTES;

    this.chunks.forEach((chunk) => {
      bytes.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    });

    return file;
  }
}

const INSTANCED_KIND = 'instanced';
const MESH_KIND = 'mesh';

export function makeGlb(nodes: readonly FixtureNode[]): ArrayBuffer {
  const writer = new GlbWriter();

  nodes.forEach((node) => {
    if (node.kind === INSTANCED_KIND) {
      const accessors = writer.addInterleaved(Object.entries(node.attributes));

      writer.nodes.push({
        name: node.name,
        extensions: { EXT_mesh_gpu_instancing: { attributes: accessors } },
      });
    } else if (node.kind === MESH_KIND) {
      const extra: [string, FixtureAttribute][] = [];

      if (node.colors) extra.push(['COLOR_0', { size: 3, values: node.colors }]);

      if (node.treeIndices) extra.push(['_treeIndex', { size: 1, values: node.treeIndices }]);

      writer.nodes.push({
        name: node.name,
        mesh: writer.addMesh(node.positions, node.indices, extra),
      });
    } else {
      const mesh = writer.addMesh(node.positions, node.indices);
      const accessors = writer.addInterleaved(Object.entries(node.attributes));

      writer.nodes.push({
        name: node.name,
        mesh,
        extensions: { EXT_mesh_gpu_instancing: { attributes: accessors } },
      });
    }
  });

  return writer.finish();
}

export const IDENTITY_MATRIX: readonly number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export function translationMatrix(first: number, second: number, third: number): readonly number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, first, second, third, 1];
}

export function scaleMatrix(first: number, second: number, third: number): readonly number[] {
  return [first, 0, 0, 0, 0, second, 0, 0, 0, 0, third, 0, 0, 0, 0, 1];
}
