import { z } from 'zod';

/**
 * Identifiers of the council members.
 * Each agent owns a single-responsibility module in the engine and speaks
 * only through the shared blackboard — agents never talk to each other directly.
 */
export const AgentIdSchema = z.enum(['tech', 'finance', 'risk', 'strategy']);

export type AgentId = z.infer<typeof AgentIdSchema>;

export const ALL_AGENT_IDS: readonly AgentId[] = ['tech', 'finance', 'risk', 'strategy'];
