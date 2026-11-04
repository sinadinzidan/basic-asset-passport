export enum AssetEquipmentTab {
  PROPERTIES = 'PROPERTIES',
  EQUIPMENTS = 'EQUIPMENTS',
}

export const ASSET_EQUIPMENT_TAB_LABELS: Record<AssetEquipmentTab, string> = {
  [AssetEquipmentTab.PROPERTIES]: 'Properties',
  [AssetEquipmentTab.EQUIPMENTS]: 'Equipments',
};

export function isAssetEquipmentTab(
  value: unknown,
): value is AssetEquipmentTab {
  return (
    value === AssetEquipmentTab.PROPERTIES ||
    value === AssetEquipmentTab.EQUIPMENTS
  );
}
