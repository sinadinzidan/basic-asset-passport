export const ASSET_PASSPORT_MODEL_SPACE = 'sp-asset-passport';
export const ASSET_PASSPORT_MODEL_EXTERNAL_ID = 'Asset_Passport';
export const ASSET_PASSPORT_MODEL_VERSION = '1';

export const ASSET_PASSPORT_INSTANCE_SPACE = 'sp-asset-passport-data';
export const ASSET_VIEW_EXTERNAL_ID = 'Asset';
export const EQUIPMENT_VIEW_EXTERNAL_ID = 'Equipment';
export const ASSET_QUERY_LIMIT = 10;

export const ASSET_SEARCH_LIMIT = 100;

export const ASSET_SEARCH_DEBOUNCE_MS = 300;
export const ASSET_QUERY_STALE_TIME_MS = 30_000;
export const COUNT_QUERY_STALE_TIME_MS = 30_000;
export const COUNT_QUERY_KEY_PART = 'count';
export const KPI_COUNTS_ERROR_TITLE = 'Some counts could not be loaded';
export const KPI_COUNTS_ERROR_DESCRIPTION =
  'Check access to the Asset and Equipment views, then try again.';
export const ASSETS_ERROR_TITLE = 'Assets could not be loaded';
export const ASSETS_ERROR_DESCRIPTION = 'Check access to the Asset view, then try again.';
export const ASSETS_LATER_PAGE_ERROR_DESCRIPTION =
  'This page may no longer exist. Try again, or go back to the first page.';
export const ASSETS_EMPTY_TITLE = 'No assets found';
export const ASSETS_EMPTY_DESCRIPTION = 'The Asset view returned no instances.';
export const ASSETS_NO_MATCH_TITLE = 'No matching assets';
export const ASSET_SEARCH_TRUNCATED_MESSAGE = `Showing the first ${ASSET_SEARCH_LIMIT} matches. Refine the search to narrow them.`;
export const ASSET_DETAILS_ERROR_TITLE = 'Asset details could not be loaded';
export const ASSET_DETAILS_ERROR_DESCRIPTION = ASSETS_ERROR_DESCRIPTION;
export const EQUIPMENT_LOADING_MESSAGE = 'Loading equipment...';
export const EQUIPMENT_ERROR_TITLE = 'Equipment could not be loaded';
export const EQUIPMENT_ERROR_DESCRIPTION = 'Check access to the Equipment view, then try again.';
export const EQUIPMENT_EMPTY_TITLE = 'No equipment linked';
export const EQUIPMENT_EMPTY_DESCRIPTION = 'There are no Equipment instances linked to this asset.';
export const ASSET_EQUIPMENT_QUERY_LIMIT = 1000;
export const OPERATING_ASSET_STATUS = 'operating';

export const NAME_PROPERTY_IDENTIFIER = 'name';

export const ASSETS_BREADCRUMB_LABEL = 'Assets';
export const DESCRIPTION_PROPERTY_IDENTIFIER = 'description';
export const PLANT_PROPERTY_IDENTIFIER = 'plantName';
export const STATUS_PROPERTY_IDENTIFIER = 'flocStatus';
export const CRITICALITY_PROPERTY_IDENTIFIER = 'abcIndicatorName';

export const ASSET_LIST_PROPERTIES: readonly string[] = [
  NAME_PROPERTY_IDENTIFIER,
  DESCRIPTION_PROPERTY_IDENTIFIER,
  PLANT_PROPERTY_IDENTIFIER,
  STATUS_PROPERTY_IDENTIFIER,
  CRITICALITY_PROPERTY_IDENTIFIER,
];

export const ASSET_SEARCH_PROPERTIES: readonly string[] = [
  NAME_PROPERTY_IDENTIFIER,
  DESCRIPTION_PROPERTY_IDENTIFIER,
  PLANT_PROPERTY_IDENTIFIER,
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
