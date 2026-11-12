import { createContext, useContext } from 'react';

import type { DocumentFileContextType } from '../../../types/documentFileContext';

export const DocumentFileContext = createContext<DocumentFileContextType | null>(null);

export function useDocumentFileContext(): DocumentFileContextType {
  const client = useContext(DocumentFileContext);

  if (client === null) {
    throw new Error('useDocumentFileContext must be used inside a DocumentFileContext provider.');
  }

  return client;
}
