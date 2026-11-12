import { z } from 'zod';

import { MODEL } from '../config/model';

import { OptionalTextSchema } from './text';

const PROPERTIES = MODEL.properties.asset;

export const AssetListPropertiesSchema = z.object({
  [PROPERTIES.name]: OptionalTextSchema,
  [PROPERTIES.description]: OptionalTextSchema,
  [PROPERTIES.plantName]: OptionalTextSchema,
  [PROPERTIES.status]: OptionalTextSchema,
  [PROPERTIES.criticality]: OptionalTextSchema,
});

export const AssetIdentifierSchema = z.object({
  space: z.string(),
  externalId: z.string(),
});
