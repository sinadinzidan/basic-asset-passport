import { describe, expect, it } from 'vitest';

import {
  ASSET_EQUIPMENT_TAB_LABELS,
  AssetEquipmentTab,
  isAssetEquipmentTab,
} from '../assetEquipmentTab';

describe(isAssetEquipmentTab.name, () => {
  it.each(Object.values(AssetEquipmentTab))('accepts %s', (value) => {
    expect(isAssetEquipmentTab(value)).toBe(true);
  });

  it.each(['properties', '', 'OTHER', 1, null, undefined])(
    'rejects %s',
    (value) => {
      expect(isAssetEquipmentTab(value)).toBe(false);
    },
  );
});

describe('ASSET_EQUIPMENT_TAB_LABELS', () => {
  it('labels every tab for display', () => {
    expect(ASSET_EQUIPMENT_TAB_LABELS).toEqual({
      [AssetEquipmentTab.PROPERTIES]: 'Properties',
      [AssetEquipmentTab.EQUIPMENTS]: 'Equipments',
      [AssetEquipmentTab.NOTES]: 'Notes',
    });
  });
});
