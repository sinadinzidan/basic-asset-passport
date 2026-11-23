export enum AssetTab {
  PROPERTIES = 'PROPERTIES',
  EQUIPMENTS = 'EQUIPMENTS',
  TIMESERIES = 'TIMESERIES',
  NOTES = 'NOTES',
  DOCUMENTS = 'DOCUMENTS',
  THREE_D = 'THREE_D',
}

export const ASSET_TAB_LABELS: Record<AssetTab, string> = {
  [AssetTab.PROPERTIES]: 'Properties',
  [AssetTab.EQUIPMENTS]: 'Equipment',
  [AssetTab.TIMESERIES]: 'Timeseries',
  [AssetTab.NOTES]: 'Notes',
  [AssetTab.DOCUMENTS]: 'Documents',
  [AssetTab.THREE_D]: '3D',
};

export function isAssetTab(value: unknown): value is AssetTab {
  return (
    value === AssetTab.PROPERTIES ||
    value === AssetTab.EQUIPMENTS ||
    value === AssetTab.TIMESERIES ||
    value === AssetTab.NOTES ||
    value === AssetTab.DOCUMENTS ||
    value === AssetTab.THREE_D
  );
}
