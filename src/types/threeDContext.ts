import type { ThreeDModel, ThreeDModelReference as ThreeDModelReference } from './threeD';

export interface ThreeDContextType {
  project: string;
  isSimulated?: boolean;
  loadModel: (reference: ThreeDModelReference) => Promise<ThreeDModel>;
  loadSector: (blobId: number, fileName: string) => Promise<ArrayBuffer>;
}
