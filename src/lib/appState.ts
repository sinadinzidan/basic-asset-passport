import { z } from 'zod';

import { ASSET_PAGE_SIZE_OPTIONS, ASSET_SEARCH_MAX_LENGTH } from '../constants/assets';
import { ASSET_VIEW_STORED_VALUES, PASSPORT_TAB_STORED_VALUES } from '../constants/persistence';
import { AssetView } from '../enums/assetView';
import { PassportTab } from '../enums/passportTab';
import type { AssetSelection, FileSelection } from '../types/asset';

import { fromStoredValue } from './enumGuards';

export type AppState = {
  assetPage?: number;
  assetPageSize?: number;
  assetView?: AssetView;
  selectedEquipmentId?: string;
  assetSearch?: string;
  passportTab?: PassportTab;
  selectedAsset?: AssetSelection;
  selectedFile?: FileSelection;
};

/** A saved asset or file: its full instance identity and a name that is never blank. */
const selectionSchema = z.object({
  space: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string(),
}).transform(({ space, externalId, name }) => ({ space, externalId, name: name.trim() || externalId }));

/** A field that is missing or invalid is left out, so one bad value never discards the rest of a saved link. */
function optionalField<Schema extends z.ZodType>(schema: Schema) {
  return schema.optional().catch(undefined);
}

const savedStateSchema = z.object({
  passportTab: optionalField(z.unknown().transform((value) => fromStoredValue(PassportTab, PASSPORT_TAB_STORED_VALUES, value))),
  assetSearch: optionalField(z.string().max(ASSET_SEARCH_MAX_LENGTH).transform((value) => value.trim()).pipe(z.string().min(1))),
  assetPageSize: optionalField(z.number().refine((size) => ASSET_PAGE_SIZE_OPTIONS.some((option) => option === size))),
  selectedEquipmentId: optionalField(z.string().min(1)),
  // The list view is the default and is never saved, so only the grid is read back.
  assetView: optionalField(z.unknown().transform((value) => fromStoredValue(AssetView, ASSET_VIEW_STORED_VALUES, value)).pipe(z.literal(AssetView.GRID))),
  assetPage: optionalField(z.number().int().nonnegative()),
  selectedAsset: optionalField(selectionSchema),
  selectedFile: optionalField(selectionSchema),
});

/** Reads the state saved in a Fusion shared link. The link is outside input, so it is validated, never trusted. */
export function parseInitialState(initialState: string | undefined): AppState {
  if (!initialState) return {};

  let value: unknown;
  try {
    value = JSON.parse(initialState);
  } catch {
    return {};
  }

  const parsed = savedStateSchema.safeParse(value);
  if (!parsed.success) return {};
  const { passportTab, assetSearch, assetPageSize, selectedEquipmentId, assetView, assetPage, selectedAsset, selectedFile } = parsed.data;

  return {
    ...(passportTab !== undefined && { passportTab }),
    ...(assetSearch !== undefined && { assetSearch }),
    ...(assetPageSize !== undefined && { assetPageSize }),
    ...(selectedEquipmentId !== undefined && { selectedEquipmentId }),
    ...(assetView !== undefined && { assetView }),
    ...(assetPage !== undefined && { assetPage }),
    ...(selectedAsset !== undefined && { selectedAsset }),
    // A file is only meaningful on top of an asset.
    ...(selectedAsset !== undefined && selectedFile !== undefined && { selectedFile }),
  };
}

/** Writes the state for the Fusion shared link, using the stored values rather than the enum members. */
export function serializeAppState(state: AppState): string {
  return JSON.stringify({
    ...state,
    ...(state.passportTab === undefined ? {} : { passportTab: PASSPORT_TAB_STORED_VALUES[state.passportTab] }),
    ...(state.assetView === undefined ? {} : { assetView: ASSET_VIEW_STORED_VALUES[state.assetView] }),
  });
}
