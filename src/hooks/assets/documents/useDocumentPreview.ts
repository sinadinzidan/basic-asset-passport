import { createContext, useContext, type ReactNode } from 'react';

import type { DocumentIdentifier } from '../../../types/document';

export type DocumentPreviewProps = { document: DocumentIdentifier };

export type RenderDocumentPreview = (document: DocumentIdentifier) => ReactNode;

export const DocumentPreviewContext = createContext<RenderDocumentPreview | null>(null);

export function useDocumentPreview(): RenderDocumentPreview | null {
  return useContext(DocumentPreviewContext);
}
