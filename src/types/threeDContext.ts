import type { ThreeDAssetNode, ThreeDModel, ThreeDModelReference } from './threeD';

export interface ThreeDContextType {
  project: string;
  isSimulated?: boolean;
  loadModel: (reference: ThreeDModelReference) => Promise<ThreeDModel>;
  loadAssetNodes: (reference: ThreeDModelReference) => Promise<ThreeDAssetNode[]>;
  loadSector: (blobId: number, fileName: string) => Promise<ArrayBuffer>;
}
