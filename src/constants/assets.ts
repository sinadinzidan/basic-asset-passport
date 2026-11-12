import { MODEL } from '../config/model';

export const ASSET_QUERY_LIMIT = 10;

export const ASSET_SEARCH_LIMIT = 100;

export const ASSET_SEARCH_DEBOUNCE_MS = 300;
export const ASSET_QUERY_STALE_TIME_MS = 30_000;
export const COUNT_QUERY_STALE_TIME_MS = 30_000;
export const COUNT_QUERY_KEY_PART = 'count';
export const KPI_ASSETS_LABEL = 'Assets';
export const KPI_OPERATING_LABEL = 'Operating';
export const KPI_EQUIPMENT_LABEL = 'Equipment';
export const KPI_COUNTS_ERROR_TITLE = 'Some counts could not be loaded';
export const KPI_COUNTS_ERROR_DESCRIPTION =
  'Check access to the Asset and Equipment views, then try again.';
export const ASSET_REGISTER_DESCRIPTION =
  'Browse functional locations and open an asset to review its properties and linked equipment.';
export const ASSETS_ERROR_TITLE = 'Assets could not be loaded';
export const ASSETS_ERROR_DESCRIPTION = 'Check access to the Asset view, then try again.';
export const ASSETS_LATER_PAGE_ERROR_DESCRIPTION =
  'This page may no longer exist. Try again, or go back to the first page.';
export const ASSETS_EMPTY_TITLE = 'No assets found';
export const ASSETS_EMPTY_DESCRIPTION = 'The Asset view returned no instances.';
export const ASSETS_NO_MATCH_TITLE = 'No matching assets';
export const ASSET_SEARCH_TRUNCATED_MESSAGE = `Showing the first ${ASSET_SEARCH_LIMIT} matches. Refine the search to narrow them.`;
export const ASSET_DETAILS_LOADING_MESSAGE = 'Loading asset and equipment properties...';
export const ASSET_DETAILS_ERROR_TITLE = 'Asset details could not be loaded';
export const ASSET_DETAILS_ERROR_DESCRIPTION = ASSETS_ERROR_DESCRIPTION;
export const EQUIPMENT_LOADING_MESSAGE = 'Loading equipment...';
export const EQUIPMENT_ERROR_TITLE = 'Equipment could not be loaded';
export const EQUIPMENT_ERROR_DESCRIPTION = 'Check access to the Equipment view, then try again.';
export const EQUIPMENT_EMPTY_TITLE = 'No equipment linked';
export const EQUIPMENT_EMPTY_DESCRIPTION = 'There are no Equipment instances linked to this asset.';
export const ASSET_EQUIPMENT_QUERY_LIMIT = 1000;
export const OPERATING_ASSET_STATUS = 'operating';

export const ASSETS_BREADCRUMB_LABEL = 'Assets';

export const ASSET_LIST_PROPERTIES: readonly string[] = [
  MODEL.properties.asset.name,
  MODEL.properties.asset.description,
  MODEL.properties.asset.plantName,
  MODEL.properties.asset.status,
  MODEL.properties.asset.criticality,
];

export const ASSET_SEARCH_PROPERTIES: readonly string[] = [
  MODEL.properties.asset.name,
  MODEL.properties.asset.description,
  MODEL.properties.asset.plantName,
];

export const INTERNAL_DETAIL_PROPERTY_IDENTIFIERS: ReadonlySet<string> = new Set([
  'source',
  'sourceId',
  'sourceSystem',
  'sourceContext',
  'sourceCreatedTime',
  'sourceUpdatedTime',
  'sourceCreatedUser',
  'sourceUpdatedUser',
  'effectiveFromDate',
  'effectiveToDate',
  'functionalLocationId',
  'spfObjectId',
  'uid',
  'workCenterObjectId',
  'createdByUser',
  'changedByUser',
]);
