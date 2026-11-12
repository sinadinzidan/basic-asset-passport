export enum AssetTab {
  PROPERTIES = 'PROPERTIES',
  EQUIPMENTS = 'EQUIPMENTS',
  TIMESERIES = 'TIMESERIES',
  NOTES = 'NOTES',
  DOCUMENTS = 'DOCUMENTS',
}

export const ASSET_TAB_LABELS: Record<AssetTab, string> = {
  [AssetTab.PROPERTIES]: 'Properties',
  [AssetTab.EQUIPMENTS]: 'Equipments',
  [AssetTab.TIMESERIES]: 'Timeseries',
  [AssetTab.NOTES]: 'Notes',
  [AssetTab.DOCUMENTS]: 'Documents',
};

export function isAssetTab(value: unknown): value is AssetTab {
  return (
    value === AssetTab.PROPERTIES ||
    value === AssetTab.EQUIPMENTS ||
    value === AssetTab.TIMESERIES ||
    value === AssetTab.NOTES ||
    value === AssetTab.DOCUMENTS
  );
}
