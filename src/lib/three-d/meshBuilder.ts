import { THREE_D_DEFAULT_COLOR_COMPONENT } from '../../constants/threeD';
import type { TessellatedMesh, Vector } from '../../types/threeD';

import { cross, dot, normalize, subtract } from './vectors';

const DEFAULT_COLOR: Vector = [
  THREE_D_DEFAULT_COLOR_COMPONENT,
  THREE_D_DEFAULT_COLOR_COMPONENT,
  THREE_D_DEFAULT_COLOR_COMPONENT,
];

export class MeshBuilder {
  private readonly positions: number[] = [];

  private readonly normals: number[] = [];

  private readonly colors: number[] = [];

  private readonly treeIndices: number[] = [];

  private readonly indices: number[] = [];

  private color: Vector = DEFAULT_COLOR;

  private treeIndex = 0;

  get vertexCount(): number {
    return this.treeIndices.length;
  }

  setStyle(color: Vector, treeIndex: number): void {
    this.color = color;
    this.treeIndex = treeIndex;
  }

  addVertex(position: Vector, normal: Vector): number {
    const index = this.vertexCount;

    this.positions.push(...position);
    this.normals.push(...normal);
    this.colors.push(...this.color);
    this.treeIndices.push(this.treeIndex);

    return index;
  }

  addTriangle(first: number, second: number, third: number): void {
    this.indices.push(first, second, third);
  }

  addFlatPolygon(corners: readonly Vector[], outward: Vector | null = null): void {
    const [first, second, third] = corners;
    const faceNormal = normalize(cross(subtract(second, first), subtract(third, first)));

    const normal =
      outward !== null && dot(faceNormal, outward) < 0
        ? normalize(cross(subtract(third, first), subtract(second, first)))
        : faceNormal;

    const indices = corners.map((corner) => this.addVertex(corner, normal));

    for (let corner = 1; corner < indices.length - 1; corner += 1) {
      this.addTriangle(indices[0], indices[corner], indices[corner + 1]);
    }
  }

  build(unsupported: Readonly<Record<string, number>> = {}): TessellatedMesh {
    return {
      positions: new Float32Array(this.positions),
      normals: new Float32Array(this.normals),
      colors: new Float32Array(this.colors),
      treeIndices: new Float32Array(this.treeIndices),
      indices: new Uint32Array(this.indices),
      unsupported,
    };
  }
}
