import { describe, expect, it } from 'vitest';

import { AssetTab } from '../../enums/assetTab';
import { DEFAULT_NAVIGATION_STATE, parseNavigationState } from '../navigationState';

describe(parseNavigationState.name, () => {
  const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };

  it('restores a valid selection and tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeAssetTab: AssetTab.EQUIPMENTS,
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeAssetTab: AssetTab.EQUIPMENTS,
    });
  });

  it('restores the search text, trimmed', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      searchQuery: '  pump ',
    });

    expect(parseNavigationState(initialState)).toMatchObject({
      searchQuery: 'pump',
    });
  });

  it('drops a blank or non-text search', () => {
    expect(parseNavigationState(JSON.stringify({ searchQuery: '   ' }))).not.toHaveProperty(
      'searchQuery',
    );
    expect(parseNavigationState(JSON.stringify({ searchQuery: 12 }))).not.toHaveProperty(
      'searchQuery',
    );
  });

  it('restores the page of the register as its trail of cursors', () => {
    const initialState = JSON.stringify({
      registerCursors: ['cursor-2', 'cursor-3'],
    });

    expect(parseNavigationState(initialState).registerCursors).toEqual(['cursor-2', 'cursor-3']);
  });

  it.each([
    ['not a list', 'cursor-2'],
    ['empty', []],
    ['holding a non-text cursor', ['cursor-2', 3]],
    ['holding an empty cursor', ['cursor-2', '']],
  ])('drops a cursor trail that is %s', (_description, registerCursors) => {
    const initialState = JSON.stringify({ registerCursors });

    expect(parseNavigationState(initialState)).not.toHaveProperty('registerCursors');
  });

  it('drops the cursor trail of a search, which has no pages', () => {
    const initialState = JSON.stringify({
      searchQuery: 'pump',
      registerCursors: ['cursor-2'],
    });

    expect(parseNavigationState(initialState)).not.toHaveProperty('registerCursors');
  });

  it('falls back to the properties tab for an unknown tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeAssetTab: 'unknown',
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeAssetTab: AssetTab.PROPERTIES,
    });
  });

  it('restores an open chart together with its asset', () => {
    const timeseriesChart = { sig: 'ts:PI.1', range: 'LAST_7_DAYS' };
    const initialState = JSON.stringify({ selectedAsset, timeseriesChart });

    expect(parseNavigationState(initialState).timeseriesChart).toEqual(timeseriesChart);
  });

  it.each([
    ['not a record', 'text'],
    ['empty', {}],
    ['holding a non-string', { sig: 1 }],
  ])('drops a chart that is %s', (_description, timeseriesChart) => {
    const initialState = JSON.stringify({ selectedAsset, timeseriesChart });

    expect(parseNavigationState(initialState)).not.toHaveProperty('timeseriesChart');
  });

  it('drops a chart when no asset is open', () => {
    const initialState = JSON.stringify({ timeseriesChart: { sig: 'a' } });

    expect(parseNavigationState(initialState)).not.toHaveProperty('timeseriesChart');
  });

  it('drops a selection that is not an asset identifier', () => {
    const initialState = JSON.stringify({ selectedAsset: { space: 1 } });

    expect(parseNavigationState(initialState).selectedAsset).toBeNull();
  });

  it.each([undefined, '', 'not json', '[]', 'null', '"text"'])(
    'returns the default state for %j',
    (initialState) => {
      expect(parseNavigationState(initialState)).toEqual(DEFAULT_NAVIGATION_STATE);
    },
  );

  it('restores an open assistant panel', () => {
    const state = parseNavigationState(JSON.stringify({ isAssistantOpen: true }));

    expect(state.isAssistantOpen).toBe(true);
  });

  it.each([false, 'true', 1, null])('leaves the assistant panel closed for %j', (value) => {
    const state = parseNavigationState(JSON.stringify({ isAssistantOpen: value }));

    expect(state).not.toHaveProperty('isAssistantOpen');
  });
});
