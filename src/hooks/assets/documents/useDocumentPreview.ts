import { createContext, useContext, type ReactNode } from 'react';

import type { DocumentIdentifier } from '../../../types/document';

export type DocumentPreviewProps = { document: DocumentIdentifier };

export type RenderDocumentPreview = (document: DocumentIdentifier) => ReactNode;

/**
 * How to show a document's content. It is null where there is no signed-in
 * client to read files with (mock mode, tests).
 */
export const DocumentPreviewContext =
  createContext<RenderDocumentPreview | null>(null);

export function useDocumentPreview(): RenderDocumentPreview | null {
  return useContext(DocumentPreviewContext);
}
