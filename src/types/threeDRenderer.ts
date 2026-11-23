import type { ThreeDInteractionMode } from '../enums/threeDInteractionMode';

import type { TessellatedMesh, ThreeDAssetLookup, ThreeDHover, ThreeDModel } from './threeD';

export interface ThreeDRenderer {
  addSector(mesh: TessellatedMesh): void;
  setAssetLookup(lookup: ThreeDAssetLookup): void;
  setInteractionMode(mode: ThreeDInteractionMode): void;
  setHoverListener(listener: (hover: ThreeDHover | null) => void): void;
  zoomIn(): void;
  zoomOut(): void;
  resetView(): void;
  dispose(): void;
}

export type ThreeDRendererFactory = (container: HTMLElement, model: ThreeDModel) => ThreeDRenderer;
