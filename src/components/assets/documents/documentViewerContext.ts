import { createContext } from 'react';

import { CogniteFileViewer } from '../../../cognite-file-viewer';

const defaultDeps = { CogniteFileViewer };

export type DocumentViewerContextType = typeof defaultDeps;
export const DocumentViewerContext = createContext<DocumentViewerContextType>(defaultDeps);
