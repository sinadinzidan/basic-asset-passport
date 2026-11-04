export const ASSET_VIEW_SPACE = 'sp-dm-idi-asset';
export const ASSET_VIEW_EXTERNAL_ID = 'Asset';
export const EQUIPMENT_VIEW_EXTERNAL_ID = 'Equipment';
export const ASSET_QUERY_LIMIT = 10;
export const ASSET_VIEW_LOOKUP_LIMIT = 1000;
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
