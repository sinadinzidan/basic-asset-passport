export const ASSET_PASSPORT_MODEL_SPACE = 'sp-asset-passport';
export const ASSET_PASSPORT_MODEL_EXTERNAL_ID = 'Asset_Passport';
export const ASSET_PASSPORT_MODEL_VERSION = '1';
export const ASSET_VIEW_EXTERNAL_ID = 'Asset';
export const EQUIPMENT_VIEW_EXTERNAL_ID = 'Equipment';
export const ASSET_QUERY_LIMIT = 10;
/** A search has no cursor, so it returns up to this many matches on one page. */
export const ASSET_SEARCH_LIMIT = 100;
/** The pause after the last keystroke before the typed text is applied as the search. */
export const ASSET_SEARCH_DEBOUNCE_MS = 300;
export const ASSET_QUERY_STALE_TIME_MS = 30_000;
export const ASSET_EQUIPMENT_QUERY_LIMIT = 1000;
export const OPERATING_ASSET_STATUS = 'operating';

export const ASSET_LIST_PROPERTIES: readonly string[] = [
  'name',
  'description',
  'plantName',
  'flocStatus',
  'abcIndicatorName',
];

/** The text properties the search looks in. */
export const ASSET_SEARCH_PROPERTIES: readonly string[] = [
  'name',
  'description',
  'plantName',
];

export const NAME_PROPERTY_IDENTIFIER = 'name';
export const STATUS_PROPERTY_IDENTIFIER = 'flocStatus';
export const CRITICALITY_PROPERTY_IDENTIFIER = 'abcIndicatorName';

export const INTERNAL_DETAIL_PROPERTY_IDENTIFIERS: ReadonlySet<string> =
  new Set([
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

export const DESCRIPTION_PROPERTY_IDENTIFIER = 'description';
export const PLANT_PROPERTY_IDENTIFIER = 'plantName';
