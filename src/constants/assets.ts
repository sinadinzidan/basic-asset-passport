import type { ViewReference } from '@cognite/sdk';

export const ASSET_PAGE_SIZE = 10;
export const ASSET_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const ASSET_SEARCH_LIMIT = 1000;
export const ASSET_SEARCH_MAX_LENGTH = 256;
export const EQUIPMENT_PAGE_SIZE = 25;
export const ASSET_LIST_SKELETON_ROW_COUNT = 5;
export const ASSET_VIEW = {
  type: 'view',
  space: 'energy_dm',
  externalId: 'EnergyAsset',
  version: 'v1',
} satisfies ViewReference;
export const EQUIPMENT_VIEW = {
  type: 'view',
  space: 'energy_dm',
  externalId: 'EnergyEquipment',
  version: 'v1',
} satisfies ViewReference;
export const FILE_VIEW = {
  type: 'view',
  space: 'energy_dm',
  externalId: 'EnergyFile',
  version: 'v1',
} satisfies ViewReference;
export const RELATED_FILES_LIMIT = 100;
