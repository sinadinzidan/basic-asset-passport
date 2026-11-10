import { describe, expect, it } from 'vitest';

import { AssetEquipmentTab } from '../../enums/assetEquipmentTab';
import {
  DEFAULT_NAVIGATION_STATE,
  parseNavigationState,
} from '../navigationState';

describe(parseNavigationState.name, () => {
  const selectedAsset = { space: 'asset-space', externalId: 'asset-1' };

  it('restores a valid selection and tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.EQUIPMENTS,
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
    expect(
      parseNavigationState(JSON.stringify({ searchQuery: '   ' })),
    ).not.toHaveProperty('searchQuery');
    expect(
      parseNavigationState(JSON.stringify({ searchQuery: 12 })),
    ).not.toHaveProperty('searchQuery');
  });

  it('falls back to the properties tab for an unknown tab', () => {
    const initialState = JSON.stringify({
      selectedAsset,
      activeEquipmentTab: 'unknown',
    });

    expect(parseNavigationState(initialState)).toEqual({
      selectedAsset,
      activeEquipmentTab: AssetEquipmentTab.PROPERTIES,
    });
  });

  it('restores an open chart together with its asset', () => {
    const timeseriesChart = { sig: 'ts:PI.1', range: 'LAST_7_DAYS' };
    const initialState = JSON.stringify({ selectedAsset, timeseriesChart });

    expect(parseNavigationState(initialState).timeseriesChart).toEqual(
      timeseriesChart,
    );
  });

  it.each([
    ['not a record', 'text'],
    ['empty', {}],
    ['holding a non-string', { sig: 1 }],
  ])('drops a chart that is %s', (_, timeseriesChart) => {
    const initialState = JSON.stringify({ selectedAsset, timeseriesChart });

    expect(parseNavigationState(initialState)).not.toHaveProperty(
      'timeseriesChart',
    );
  });

  it('drops a chart when no asset is open', () => {
    const initialState = JSON.stringify({ timeseriesChart: { sig: 'a' } });

    expect(parseNavigationState(initialState)).not.toHaveProperty(
      'timeseriesChart',
    );
  });

  it('drops a selection that is not an asset identifier', () => {
    const initialState = JSON.stringify({ selectedAsset: { space: 1 } });

    expect(parseNavigationState(initialState).selectedAsset).toBeNull();
  });

  it.each([undefined, '', 'not json', '[]', 'null', '"text"'])(
    'returns the default state for %j',
    (initialState) => {
      expect(parseNavigationState(initialState)).toEqual(
        DEFAULT_NAVIGATION_STATE,
      );
    },
  );
});
