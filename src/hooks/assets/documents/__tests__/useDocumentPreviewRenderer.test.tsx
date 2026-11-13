import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  DocumentPreviewRendererContext,
  useDocumentPreviewRenderer,
  type RenderDocumentPreview,
} from '../useDocumentPreviewRenderer';

describe(useDocumentPreviewRenderer.name, () => {
  it('has no preview where none is supplied, as in mock mode', () => {
    const { result } = renderHook(() => useDocumentPreviewRenderer());

    expect(result.current).toBeNull();
  });

  it('gives the preview its provider supplies', () => {
    const renderPreview: RenderDocumentPreview = (document) => document.externalId;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DocumentPreviewRendererContext.Provider value={renderPreview}>
        {children}
      </DocumentPreviewRendererContext.Provider>
    );

    const { result } = renderHook(() => useDocumentPreviewRenderer(), { wrapper });

    expect(result.current).toBe(renderPreview);
  });
});
