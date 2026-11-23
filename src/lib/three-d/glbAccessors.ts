import type { GltfAccessor } from '../../schemas/glb';
import type { ParsedAttribute } from '../../types/threeD';

import type { GlbContainer } from './glbContainer';

const BYTE = 5120;
const UNSIGNED_BYTE = 5121;
const SHORT = 5122;
const UNSIGNED_SHORT = 5123;
const UNSIGNED_INT = 5125;
const FLOAT = 5126;

const SCALAR_SIZE = 1;
const VECTOR_2_SIZE = 2;
const VECTOR_3_SIZE = 3;
const VECTOR_4_SIZE = 4;
const MATRIX_2_SIZE = 4;
const MATRIX_3_SIZE = 9;
const MATRIX_4_SIZE = 16;

const BYTE_MAX = 127;
const UNSIGNED_BYTE_MAX = 255;
const SHORT_MAX = 32767;
const UNSIGNED_SHORT_MAX = 65535;
const UNSIGNED_INT_MAX = 4294967295;

type ComponentReader = {
  bytes: number;
  maximum: number;
  read: (view: DataView, offset: number) => number;
};

const COMPONENT_READERS = new Map<number, ComponentReader>([
  [BYTE, { bytes: 1, maximum: BYTE_MAX, read: (view, offset) => view.getInt8(offset) }],
  [
    UNSIGNED_BYTE,
    { bytes: 1, maximum: UNSIGNED_BYTE_MAX, read: (view, offset) => view.getUint8(offset) },
  ],
  [SHORT, { bytes: 2, maximum: SHORT_MAX, read: (view, offset) => view.getInt16(offset, true) }],
  [
    UNSIGNED_SHORT,
    { bytes: 2, maximum: UNSIGNED_SHORT_MAX, read: (view, offset) => view.getUint16(offset, true) },
  ],
  [
    UNSIGNED_INT,
    { bytes: 4, maximum: UNSIGNED_INT_MAX, read: (view, offset) => view.getUint32(offset, true) },
  ],
  [FLOAT, { bytes: 4, maximum: 1, read: (view, offset) => view.getFloat32(offset, true) }],
]);

const TYPE_SIZES = new Map<string, number>([
  ['SCALAR', SCALAR_SIZE],
  ['VEC2', VECTOR_2_SIZE],
  ['VEC3', VECTOR_3_SIZE],
  ['VEC4', VECTOR_4_SIZE],
  ['MAT2', MATRIX_2_SIZE],
  ['MAT3', MATRIX_3_SIZE],
  ['MAT4', MATRIX_4_SIZE],
]);

function describeAccessor(accessor: GltfAccessor): { reader: ComponentReader; size: number } {
  const reader = COMPONENT_READERS.get(accessor.componentType);
  const size = TYPE_SIZES.get(accessor.type);

  if (reader === undefined)
    throw new Error(`Unsupported glTF component type ${accessor.componentType}.`);

  if (size === undefined) throw new Error(`Unsupported glTF accessor type ${accessor.type}.`);

  return { reader, size };
}

export function readAccessor(
  container: GlbContainer,
  accessorIndex: number,
  shouldNormalizeIntegers = false,
): ParsedAttribute {
  const accessor = container.json.accessors[accessorIndex];

  if (accessor === undefined) throw new Error(`The accessor ${accessorIndex} does not exist.`);

  const bufferView = container.json.bufferViews[accessor.bufferView];

  if (bufferView === undefined)
    throw new Error(`The buffer view ${accessor.bufferView} does not exist.`);

  const { reader, size } = describeAccessor(accessor);
  const stride = bufferView.byteStride ?? size * reader.bytes;
  const start = container.binaryOffset + (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const isNormalizing = shouldNormalizeIntegers || accessor.normalized === true;
  const divisor = isNormalizing && accessor.componentType !== FLOAT ? reader.maximum : 1;
  const view = new DataView(container.buffer);
  const values = new Float32Array(accessor.count * size);

  for (let element = 0; element < accessor.count; element += 1) {
    for (let component = 0; component < size; component += 1) {
      values[element * size + component] =
        reader.read(view, start + element * stride + component * reader.bytes) / divisor;
    }
  }

  return { values, size };
}

export function readIndices(container: GlbContainer, accessorIndex: number): Uint32Array {
  return Uint32Array.from(readAccessor(container, accessorIndex).values);
}
