import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { DocumentFileContextType } from '../../../../types/documentFileContext';
import { DocumentFileContext, useDocumentFileContext } from '../useDocumentFileContext';

describe(useDocumentFileContext.name, () => {
  it('returns the file client from the provider', () => {
    const fileClient: DocumentFileContextType = {
      requestUploadUrl: vi.fn(),
      uploadContent: vi.fn(),
    };

    const { result } = renderHook(() => useDocumentFileContext(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DocumentFileContext.Provider value={fileClient}>{children}</DocumentFileContext.Provider>
      ),
    });

    expect(result.current).toBe(fileClient);
  });

  it('fails clearly when used outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useDocumentFileContext())).toThrow(
      'useDocumentFileContext must be used inside',
    );
  });
});
