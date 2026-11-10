import { createContext, useContext } from 'react';

import type { DocumentFileClient } from '../../../types/documentFileClient';

export const DocumentFileClientContext =
  createContext<DocumentFileClient | null>(null);

export function useDocumentFileClient(): DocumentFileClient {
  const client = useContext(DocumentFileClientContext);

  if (client === null) {
    throw new Error(
      'useDocumentFileClient must be used inside a DocumentFileClientContext provider.',
    );
  }

  return client;
}
