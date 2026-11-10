import { useCogniteSdk } from '@cognite/app-sdk/react';
import { createContext } from 'react';

import { CogniteFileViewer } from '../../../cognite-file-viewer';

const defaultDeps = { useCogniteSdk, CogniteFileViewer };
export type LiveDocumentPreviewContextType = typeof defaultDeps;
export const LiveDocumentPreviewContext =
  createContext<LiveDocumentPreviewContextType>(defaultDeps);
