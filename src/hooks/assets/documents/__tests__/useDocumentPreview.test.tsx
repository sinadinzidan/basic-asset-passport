import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DocumentPreviewContext,
  useDocumentPreview,
  type RenderDocumentPreview,
} from '../useDocumentPreview';

describe(useDocumentPreview.name, () => {
  it('has no preview where none is supplied, as in mock mode', () => {
    const { result } = renderHook(() => useDocumentPreview());

    expect(result.current).toBeNull();
  });

  it('gives the preview its provider supplies', () => {
    const renderPreview: RenderDocumentPreview = (document) => document.externalId;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentPreviewContext.Provider value={renderPreview}>
        {children}
      </DocumentPreviewContext.Provider>
    );

    const { result } = renderHook(() => useDocumentPreview(), { wrapper });

    expect(result.current).toBe(renderPreview);
  });
});
