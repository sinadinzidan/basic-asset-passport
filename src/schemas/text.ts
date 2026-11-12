import { z } from 'zod';

export const OptionalTextSchema = z
  .string()
  .nullish()
  .transform((text) => (text && text.trim().length > 0 ? text : null));
