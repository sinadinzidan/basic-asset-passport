const BYTE = 256;
const BYTE_SQUARED = BYTE * BYTE;

export function encodePickColor(treeIndex: number): [number, number, number] {
  const id = treeIndex + 1;

  return [id % BYTE, Math.floor(id / BYTE) % BYTE, Math.floor(id / BYTE_SQUARED) % BYTE];
}

export function decodePickColor(red: number, green: number, blue: number): number | null {
  const id = red + green * BYTE + blue * BYTE_SQUARED;

  return id === 0 ? null : id - 1;
}
