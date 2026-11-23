import type { GeometryCollectionType } from '../enums/geometryCollectionType';

export type Vector = readonly [number, number, number];

export type ParsedAttribute = {
  values: Float32Array;
  size: number;
};

export type ParsedMesh = {
  positions: Float32Array;
  indices: Uint32Array;
};

export type ParsedCollection = {
  type: GeometryCollectionType;
  count: number;
  attributes: Readonly<Record<string, ParsedAttribute>>;
  mesh: ParsedMesh | null;
};

export type TessellatedMesh = {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  treeIndices: Float32Array;
  indices: Uint32Array;
  unsupported: Readonly<Record<string, number>>;
};

export type ThreeDBox = {
  min: Vector;
  max: Vector;
};

export type ThreeDSector = {
  id: number;
  depth: number;
  fileName: string;
  downloadSize: number;
};

export type ThreeDScene = {
  unit: string;
  sectors: ThreeDSector[];
  boundingBox: ThreeDBox;
};

export type ThreeDModel = {
  modelId: number;
  revisionId: number;
  name: string;
  blobId: number;
  rotation: Vector | null;
  scale: Vector | null;
  translation: Vector | null;
  scene: ThreeDScene;
};

export type ThreeDLoadProgress = {
  loadedSectors: number;
  failedSectors: number;
  totalSectors: number;
  skippedSectors: number;
  triangleCount: number;
  unsupported: Readonly<Record<string, number>>;
};
