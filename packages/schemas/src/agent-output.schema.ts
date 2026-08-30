import { z } from 'zod';
import { AgentIdSchema } from './agent.schema.js';
import { ObjectionSchema, SourceSchema, VerdictRecommendationSchema, VerdictRiskSchema } from './blackboard.schema.js';

/**
 * Contracts for the LLM-facing steps of the orchestration DAG.
 * Every step returns strictly-typed JSON, so a hallucinated format can never
 * crash the engine — Zod rejects it and the runner retries with feedback.
 */

/** Search queries an agent designs before investigating. */
export const QueryPlanSchema = z.object({
  queries: z.array(z.string().min(3)).min(1).max(3),
});

export type QueryPlan = z.infer<typeof QueryPlanSchema>;

/** Structured findings produced by an agent from the fetched evidence pack. */
export const InvestigationOutputSchema = z.object({
  summary: z.string().min(1),
  claims: z
    .array(
      z.object({
        claim: z.string().min(1),
        evidence: z.string().min(1),
        sources: z.array(SourceSchema).default([]),
      })
    )
    .min(1),
  openQuestions: z.array(z.string()).default([]),
});

export type InvestigationOutput = z.infer<typeof InvestigationOutputSchema>;

/** A round-scoped debate position, including objections to other agents. */
export const PositionOutputSchema = z.object({
  stance: z.enum(['supports', 'concerns', 'mixed']),
  headline: z.string().min(1),
  argument: z.string().min(1),
  objections: z.array(ObjectionSchema).default([]),
  supportingFindingIds: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
});

export type PositionOutput = z.infer<typeof PositionOutputSchema>;

/** The final synthesis, produced by the strategy chair and Zod-validated. */
export const VerdictOutputSchema = z.object({
  summary: z.string().min(1),
  recommendations: z.array(VerdictRecommendationSchema).default([]),
  risks: z.array(VerdictRiskSchema).default([]),
  sources: z.array(SourceSchema).default([]),
  confidence: z.number().min(0).max(100),
});

export type VerdictOutput = z.infer<typeof VerdictOutputSchema>;

/** Which agent owns a recommendation in a verdict. */
export const RecommendationOwnerSchema = AgentIdSchema;
