import { describe, expect, it } from 'vitest';

import { ASSET_TAB_LABELS, AssetTab, isAssetTab } from '../assetTab';

describe(isAssetTab.name, () => {
  it.each(Object.values(AssetTab))('accepts %s', (value) => {
    expect(isAssetTab(value)).toBe(true);
  });

  it.each(['properties', '', 'OTHER', 1, null, undefined])('rejects %s', (value) => {
    expect(isAssetTab(value)).toBe(false);
  });
});

describe('ASSET_TAB_LABELS', () => {
  it('labels every tab for display', () => {
    expect(ASSET_TAB_LABELS).toEqual({
      [AssetTab.PROPERTIES]: 'Properties',
      [AssetTab.EQUIPMENTS]: 'Equipments',
      [AssetTab.TIMESERIES]: 'Timeseries',
      [AssetTab.NOTES]: 'Notes',
      [AssetTab.DOCUMENTS]: 'Documents',
    });
  });
});
