import { z } from 'zod';

import { AssetTab } from '../enums/assetTab';

import { AssetIdentifierSchema } from './asset';

export const NavigationStateSchema = z.object({
  selectedAsset: AssetIdentifierSchema.nullable().catch(null),
  activeAssetTab: z.enum(AssetTab).catch(AssetTab.PROPERTIES),
  searchQuery: z.string().trim().catch(''),
  assetTableCursors: z.array(z.string().min(1)).catch([]),
  timeseriesChart: z
    .record(z.string(), z.string())
    .refine((options) => Object.keys(options).length > 0)
    .optional()
    .catch(undefined),
  isAssistantOpen: z.literal(true).optional().catch(undefined),
});
