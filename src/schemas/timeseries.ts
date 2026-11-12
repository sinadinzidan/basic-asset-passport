import { z } from 'zod';

export const DatapointsResponseSchema = z.object({
  items: z.array(z.unknown()),
});

export const DatapointsItemSchema = z.object({
  instanceId: z.object({ space: z.string(), externalId: z.string() }),
  datapoints: z.array(z.unknown()).catch([]),
});

export const AverageDatapointSchema = z.object({
  timestamp: z.number(),
  average: z.number(),
});
