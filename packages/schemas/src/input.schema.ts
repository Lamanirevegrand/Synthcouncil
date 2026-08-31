import { z } from 'zod';
import { AgentIdSchema, ALL_AGENT_IDS } from './agent.schema.js';

/**
 * Request contracts for the public REST API. Every route validates its
 * payload against these before touching the engine.
 */

export const CreateSessionInputSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(2000),
  context: z.string().max(4000).optional(),
  agents: z.array(AgentIdSchema).min(2).default([...ALL_AGENT_IDS]),
  debateRounds: z.number().int().min(1).max(4).optional(),
  requireArbitration: z.boolean().optional(),
  model: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionInputSchema>;

export const ArbitrateInputSchema = z
  .object({
    directive: z.string().min(1, 'Directive cannot be empty').max(4000).optional(),
    targetAgent: AgentIdSchema.optional(),
    proceed: z.boolean().optional(),
    stop: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.directive && !value.proceed && !value.stop) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['directive'],
        message: 'Provide a directive, or set "proceed": true to continue, or "stop": true to end the debate now',
      });
    }
  });

export type ArbitrateInput = z.infer<typeof ArbitrateInputSchema>;
