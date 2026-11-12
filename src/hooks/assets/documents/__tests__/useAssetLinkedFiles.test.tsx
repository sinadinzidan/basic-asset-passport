import { renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DOCUMENT_QUERY_LIMIT } from '../../../../constants/documents';
import { DocumentOrigin } from '../../../../enums/documentOrigin';
import { makeMockClient } from '../../../../mocks/cogniteClient';
import { makeAssetDocument } from '../../../../mocks/documents';
import { makeLimitedList } from '../../../../mocks/lists';
import { makeQueryClientWrapper } from '../../../../mocks/QueryClientWrapper';
import { AssetContext } from '../../useAssetContext';
import {
  useAssetLinkedFiles,
  UseAssetLinkedFilesContext,
  type UseAssetLinkedFilesContextType,
} from '../useAssetLinkedFiles';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };

describe(useAssetLinkedFiles.name, () => {
  const client = makeMockClient();
  let mockContext: UseAssetLinkedFilesContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = {
      listAssetLinkedFiles: vi.fn(() =>
        Promise.resolve(makeLimitedList([makeAssetDocument({ origin: DocumentOrigin.RMDM })])),
      ),
    };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAssetLinkedFilesContext.Provider value={mockContext}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAssetLinkedFilesContext.Provider>
    );
  });

  it('is pending until the files arrive', async () => {
    const { result } = renderHook(() => useAssetLinkedFiles(assetIdentifier), {
      wrapper,
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('loads the files linked to the asset with the injected client', async () => {
    const files = makeLimitedList([
      makeAssetDocument({ externalId: 'file-2', origin: DocumentOrigin.RMDM }),
    ]);
    vi.mocked(mockContext.listAssetLinkedFiles).mockResolvedValue(files);

    const { result } = renderHook(() => useAssetLinkedFiles(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(files));
    expect(mockContext.listAssetLinkedFiles).toHaveBeenCalledWith(
      client,
      assetIdentifier,
      DOCUMENT_QUERY_LIMIT,
    );
  });

  it('reads the files to the limit asked for', async () => {
    const { result } = renderHook(() => useAssetLinkedFiles(assetIdentifier, 300), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockContext.listAssetLinkedFiles).toHaveBeenCalledWith(client, assetIdentifier, 300);
  });

  it('reports a failed load', async () => {
    vi.mocked(mockContext.listAssetLinkedFiles).mockRejectedValue(new Error('no access'));

    const { result } = renderHook(() => useAssetLinkedFiles(assetIdentifier), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
