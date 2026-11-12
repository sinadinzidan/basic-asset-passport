import { act, renderHook, waitFor } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeMockClient } from '../../../../__mocks__/cogniteClient';
import { makeQueryClientWrapper } from '../../../../__mocks__/QueryClientWrapper';
import type { AssetNoteService } from '../../../../services/assets/notes/assetNote';
import { AssetContext } from '../../useAssetContext';
import { UseAddAssetNoteContext } from '../useAddAssetNote';
import { useAssetNoteAddViewModel } from '../useAssetNoteAddViewModel';

const assetIdentifier = { space: 'asset-space', externalId: 'FLOC-1' };
const note = { title: 'Inspection', body: 'All good' };

describe(useAssetNoteAddViewModel.name, () => {
  const client = makeMockClient();
  let noteService: Pick<AssetNoteService, 'createAssetNote'>;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    noteService = { createAssetNote: vi.fn(() => Promise.resolve()) };
    const QueryWrapper = makeQueryClientWrapper();
    wrapper = ({ children }) => (
      <UseAddAssetNoteContext.Provider value={{ createAssetNoteService: () => noteService }}>
        <QueryWrapper>
          <AssetContext.Provider value={client}>{children}</AssetContext.Provider>
        </QueryWrapper>
      </UseAddAssetNoteContext.Provider>
    );
  });

  function renderViewModel() {
    return renderHook(() => useAssetNoteAddViewModel(assetIdentifier), { wrapper });
  }

  it('can save a note with a title, and not one without', () => {
    const { result } = renderViewModel();

    expect(result.current.canSave(note)).toBe(true);
    expect(result.current.canSave({ title: '   ', body: 'Text' })).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.saveErrorMessage).toBeNull();
  });

  it('is saving, and cannot save again, while the note is written', async () => {
    vi.mocked(noteService.createAssetNote).mockReturnValue(new Promise(() => {}));
    const { result } = renderViewModel();

    act(() => result.current.save(note, vi.fn()));

    await waitFor(() => expect(result.current.isSaving).toBe(true));
    expect(result.current.canSave(note)).toBe(false);
  });

  it('creates the note for the asset, then says it is saved', async () => {
    const onSaved = vi.fn();
    const { result } = renderViewModel();

    act(() => result.current.save(note, onSaved));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(noteService.createAssetNote).toHaveBeenCalledWith(assetIdentifier, note);
  });

  it('does not send a note that cannot be saved', () => {
    const { result } = renderViewModel();

    act(() => result.current.save({ title: '', body: '' }, vi.fn()));

    expect(noteService.createAssetNote).not.toHaveBeenCalled();
  });

  it('keeps why the note could not be saved, and drops it when asked', async () => {
    vi.mocked(noteService.createAssetNote).mockRejectedValue(new Error('No write access.'));
    const onSaved = vi.fn();
    const { result } = renderViewModel();
    act(() => result.current.save(note, onSaved));
    await waitFor(() => expect(result.current.saveErrorMessage).toBe('No write access.'));
    expect(onSaved).not.toHaveBeenCalled();

    act(() => result.current.discardSaveError());

    await waitFor(() => expect(result.current.saveErrorMessage).toBeNull());
  });
});
