import { GltfJsonSchema, type GltfJson } from '../../schemas/glb';

const GLB_MAGIC = 'glTF';
const JSON_CHUNK_TYPE = 'JSON';
const GLB_VERSION = 2;
const GLB_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const VERSION_OFFSET = 4;
const CHUNK_TYPE_OFFSET = 4;
const MAGIC_LENGTH = 4;

export type GlbContainer = {
  json: GltfJson;
  binaryOffset: number;
  buffer: ArrayBuffer;
};

export function parseGlbContainer(buffer: ArrayBuffer): GlbContainer {
  if (buffer.byteLength < GLB_HEADER_BYTES + CHUNK_HEADER_BYTES)
    throw new Error('The file is too short to be a GLB file.');

  const decoder = new TextDecoder();
  const header = new DataView(buffer, 0, GLB_HEADER_BYTES);
  const magic = decoder.decode(new Uint8Array(buffer, 0, MAGIC_LENGTH));

  if (magic !== GLB_MAGIC) throw new Error('The file is not a GLB file.');

  if (header.getUint32(VERSION_OFFSET, true) !== GLB_VERSION)
    throw new Error('Only glTF version 2 is supported.');

  const jsonChunk = new DataView(buffer, GLB_HEADER_BYTES, CHUNK_HEADER_BYTES);
  const jsonLength = jsonChunk.getUint32(0, true);

  const jsonType = decoder.decode(
    new Uint8Array(buffer, GLB_HEADER_BYTES + CHUNK_TYPE_OFFSET, MAGIC_LENGTH),
  );

  if (jsonType !== JSON_CHUNK_TYPE) throw new Error('The first GLB chunk is not JSON.');

  const jsonStart = GLB_HEADER_BYTES + CHUNK_HEADER_BYTES;

  const json = GltfJsonSchema.parse(
    JSON.parse(decoder.decode(new Uint8Array(buffer, jsonStart, jsonLength))),
  );

  const binaryChunkStart = jsonStart + jsonLength;

  const binaryType = decoder.decode(
    new Uint8Array(buffer, binaryChunkStart + CHUNK_TYPE_OFFSET, MAGIC_LENGTH),
  );

  if (!binaryType.startsWith('BIN')) throw new Error('The second GLB chunk is not binary data.');

  return { json, binaryOffset: binaryChunkStart + CHUNK_HEADER_BYTES, buffer };
}
