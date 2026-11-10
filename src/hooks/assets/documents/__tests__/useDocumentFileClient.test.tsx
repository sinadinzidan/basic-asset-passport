import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { DocumentFileClient } from '../../../../types/documentFileClient';
import {
  DocumentFileClientContext,
  useDocumentFileClient,
} from '../useDocumentFileClient';

describe(useDocumentFileClient.name, () => {
  it('returns the file client from the provider', () => {
    const fileClient: DocumentFileClient = {
      requestUploadUrl: vi.fn(),
      uploadContent: vi.fn(),
    };

    const { result } = renderHook(() => useDocumentFileClient(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DocumentFileClientContext.Provider value={fileClient}>
          {children}
        </DocumentFileClientContext.Provider>
      ),
    });

    expect(result.current).toBe(fileClient);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useDocumentFileClient())).toThrow(
      'useDocumentFileClient must be used inside',
    );
  });
});
