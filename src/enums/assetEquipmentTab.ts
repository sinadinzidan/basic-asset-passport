export enum AssetEquipmentTab {
  PROPERTIES = 'PROPERTIES',
  EQUIPMENTS = 'EQUIPMENTS',
  TIMESERIES = 'TIMESERIES',
  NOTES = 'NOTES',
  DOCUMENTS = 'DOCUMENTS',
}

export const ASSET_EQUIPMENT_TAB_LABELS: Record<AssetEquipmentTab, string> = {
  [AssetEquipmentTab.PROPERTIES]: 'Properties',
  [AssetEquipmentTab.EQUIPMENTS]: 'Equipments',
  [AssetEquipmentTab.TIMESERIES]: 'Timeseries',
  [AssetEquipmentTab.NOTES]: 'Notes',
  [AssetEquipmentTab.DOCUMENTS]: 'Documents',
};

export function isAssetEquipmentTab(
  value: unknown,
): value is AssetEquipmentTab {
  return (
    value === AssetEquipmentTab.PROPERTIES ||
    value === AssetEquipmentTab.EQUIPMENTS ||
    value === AssetEquipmentTab.TIMESERIES ||
    value === AssetEquipmentTab.NOTES ||
    value === AssetEquipmentTab.DOCUMENTS
  );
}
