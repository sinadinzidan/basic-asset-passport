import { CogniteClient } from '@cognite/sdk';
import { act, renderHook } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EquipmentRecord, FileRecord } from '../../../types/asset';
import { EquipmentPageViewModelContext, useEquipmentPageViewModel } from '../useEquipmentPageViewModel';
import type { EquipmentPageViewModelContextType } from '../useEquipmentPageViewModel';

type EquipmentResult = ReturnType<EquipmentPageViewModelContextType['useAssetEquipment']>;
type FilesResult = ReturnType<EquipmentPageViewModelContextType['useRelatedFiles']>;

const asset = { space: 'energy', externalId: 'A-1', name: 'Feed pump' };

describe(useEquipmentPageViewModel.name, () => {
  let mockContext: EquipmentPageViewModelContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;
  const client = new CogniteClient({ appId: 'test', project: 'test', getToken: async () => 'token' });

  beforeEach(() => {
    mockContext = { useCogniteSdk: vi.fn(() => client), useAssetEquipment: vi.fn(), useRelatedFiles: vi.fn() };
    wrapper = ({ children }) => (
      <EquipmentPageViewModelContext.Provider value={mockContext}>{children}</EquipmentPageViewModelContext.Provider>
    );
  });

  it('has no passports while equipment is loading', () => {
    vi.mocked(mockContext.useAssetEquipment).mockReturnValue(equipmentResult({ isFetching: true }));
    vi.mocked(mockContext.useRelatedFiles).mockReturnValue(filesResult({ isLoading: true }));
    const { result } = renderHook(() => useEquipmentPageViewModel(asset), { wrapper });
    expect(result.current).toMatchObject({ client, passports: undefined, assetFiles: [], isEquipmentFetching: true, isFilesLoading: true });
  });

  it('builds a passport per equipment item and exposes asset files', () => {
    const equipment: EquipmentRecord = { id: 'e1', space: 'energy', externalId: 'M-1', name: 'Motor', details: [] };
    const assetFile: FileRecord = { id: 'f1', space: 'files', externalId: 'DOC-1', name: 'Datasheet' };
    vi.mocked(mockContext.useAssetEquipment).mockReturnValue(equipmentResult({ data: [equipment] }));
    vi.mocked(mockContext.useRelatedFiles).mockReturnValue(filesResult({ data: { assetFiles: [assetFile], equipmentFiles: [] } }));
    const { result } = renderHook(() => useEquipmentPageViewModel(asset), { wrapper });
    expect(result.current.passports).toHaveLength(1);
    expect(result.current.passports?.[0]?.asset.name).toBe('Motor');
    expect(result.current.assetFiles).toEqual([assetFile]);
    expect(mockContext.useRelatedFiles).toHaveBeenCalledWith(asset, [equipment]);
  });

  it('exposes equipment and file errors with retry actions', () => {
    const retryEquipment = vi.fn();
    const retryFiles = vi.fn();
    vi.mocked(mockContext.useAssetEquipment).mockReturnValue(equipmentResult({ error: new Error('No equipment'), refetch: retryEquipment }));
    vi.mocked(mockContext.useRelatedFiles).mockReturnValue(filesResult({ error: new Error('No files'), refetch: retryFiles }));
    const { result } = renderHook(() => useEquipmentPageViewModel(asset), { wrapper });
    expect(result.current).toMatchObject({ equipmentErrorMessage: 'No equipment', filesErrorMessage: 'No files' });
    act(() => { result.current.retryEquipment(); result.current.retryFiles(); });
    expect(retryEquipment).toHaveBeenCalledOnce();
    expect(retryFiles).toHaveBeenCalledOnce();
  });
});

function equipmentResult(overrides: Partial<EquipmentResult>): EquipmentResult {
  return { data: undefined, isFetching: false, error: null, refetch: vi.fn(), ...overrides } as Partial<EquipmentResult> as EquipmentResult;
}

function filesResult(overrides: Partial<FilesResult>): FilesResult {
  return { data: undefined, isLoading: false, isFetching: false, error: null, refetch: vi.fn(), ...overrides } as Partial<FilesResult> as FilesResult;
}
