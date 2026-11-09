export enum AssetEquipmentTab {
  PROPERTIES = 'PROPERTIES',
  EQUIPMENTS = 'EQUIPMENTS',
  NOTES = 'NOTES',
}

export const ASSET_EQUIPMENT_TAB_LABELS: Record<AssetEquipmentTab, string> = {
  [AssetEquipmentTab.PROPERTIES]: 'Properties',
  [AssetEquipmentTab.EQUIPMENTS]: 'Equipments',
  [AssetEquipmentTab.NOTES]: 'Notes',
};

export function isAssetEquipmentTab(
  value: unknown,
): value is AssetEquipmentTab {
  return (
    value === AssetEquipmentTab.PROPERTIES ||
    value === AssetEquipmentTab.EQUIPMENTS ||
    value === AssetEquipmentTab.NOTES
  );
}
