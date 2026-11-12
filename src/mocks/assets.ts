import type { AssetInstanceDetails, AssetListItem, AssetPage } from '../types/asset';

export function makeAssetListItem(overrides: Partial<AssetListItem> = {}): AssetListItem {
  return {
    space: 'asset-instance-space',
    externalId: 'FLOC-100',
    name: 'Cooling Water Pump',
    description: 'North process cooling system',
    plantName: 'North Plant',
    flocStatus: 'Operating',
    abcIndicatorName: 'A - High criticality',
    ...overrides,
  };
}

export function makeAssetPage(
  items: AssetListItem[] = [makeAssetListItem()],
  nextCursor: string | null = null,
): AssetPage {
  return { items, nextCursor };
}

export function makeInstanceDetails(
  overrides: Partial<AssetInstanceDetails> = {},
): AssetInstanceDetails {
  return {
    space: 'asset-instance-space',
    externalId: 'FLOC-100',
    properties: [
      { identifier: 'name', label: 'Name', value: 'Cooling Water Pump' },
      { identifier: 'plantId', label: 'Plant ID', value: 'G307' },
    ],
    ...overrides,
  };
}
