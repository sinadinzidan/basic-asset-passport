import { z } from 'zod';

export const AgentListResponseSchema = z.object({
  items: z.array(z.unknown()),
});

export const AgentSchema = z.object({
  externalId: z.string().min(1),
  name: z.unknown().optional(),
  description: z.unknown().optional(),
});

export const AgentReplyResponseSchema = z.object({
  response: z.object({
    messages: z.array(z.unknown()),
    cursor: z.unknown().optional(),
  }),
});

export const AgentMessageSchema = z.object({
  role: z.unknown().optional(),
  content: z.object({ text: z.unknown().optional() }).optional().catch(undefined),
  actions: z.array(z.unknown()).optional().catch(undefined),
});
