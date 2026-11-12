import { z } from 'zod';

import { MODEL } from '../config/model';

import { OptionalTextSchema } from './text';

const PROPERTIES = MODEL.properties.document;

const TimestampSchema = z
  .string()
  .nullish()
  .transform((text) => {
    const milliseconds = text ? Date.parse(text) : Number.NaN;

    return Number.isNaN(milliseconds) ? null : milliseconds;
  });

export const DocumentPropertiesSchema = z.object({
  [PROPERTIES.name]: OptionalTextSchema,
  [PROPERTIES.mimeType]: OptionalTextSchema,
  [PROPERTIES.isUploaded]: z
    .boolean()
    .nullish()
    .transform((isMarked) => isMarked === true),
  [PROPERTIES.uploadedTime]: TimestampSchema,
});

export const UploadLinkResponseSchema = z.object({
  items: z.tuple([z.object({ uploadUrl: z.string().min(1) })]).rest(z.unknown()),
});
