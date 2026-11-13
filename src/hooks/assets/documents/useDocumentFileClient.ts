import { createContext, useContext } from 'react';

import type { DocumentFileContextType } from '../../../types/documentFileContext';

export const DocumentFileClientContext = createContext<DocumentFileContextType | null>(null);

export function useDocumentFileClient(): DocumentFileContextType {
  const client = useContext(DocumentFileClientContext);

  if (client === null) {
    throw new Error(
      'useDocumentFileClient must be used inside a DocumentFileClientContext provider.',
    );
  }

  return client;
}
