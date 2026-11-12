import { useCogniteSdk } from '@cognite/app-sdk/react';
import { createContext } from 'react';

import { CogniteFileViewer } from '../../../cognite-file-viewer';

const defaultDeps = { useCogniteSdk, CogniteFileViewer };
export type DocumentPreviewDepsContextType = typeof defaultDeps;
export const DocumentPreviewDepsContext =
  createContext<DocumentPreviewDepsContextType>(defaultDeps);
