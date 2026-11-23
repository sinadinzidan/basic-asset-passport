import type { ThreeDModel } from './threeD';

export interface ThreeDContextType {
  project: string;
  isSimulated?: boolean;
  findModel: (name: string) => Promise<ThreeDModel | null>;
  loadSector: (blobId: number, fileName: string) => Promise<ArrayBuffer>;
}
