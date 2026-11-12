import { z } from 'zod';

export const RetryAfterErrorSchema = z.object({
  headers: z.record(z.string(), z.unknown()),
});
