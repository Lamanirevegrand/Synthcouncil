import { z } from 'zod';
import { AgentIdSchema } from './agent.schema.js';

/**
 * Lifecycle phases of a council session (the orchestration DAG).
 *
 *   created ──▶ investigating ──▶ debating ──▶ arbitrating ──▶ synthesizing ──▶ complete
 *                    │                │             │                │
 *                    └────────────────┴─────────────┘                └──▶ error (any phase)
 *
 * `arbitrating` is the human-in-the-loop gate: the engine pauses there until
 * the arbiter issues a directive or explicitly proceeds.
 */
export const PhaseSchema = z.enum([
  'created',
  'investigating',
  'debating',
  'arbitrating',
  'synthesizing',
  'complete',
  'error',
]);

export type Phase = z.infer<typeof PhaseSchema>;

/** A source consulted by an agent during its investigation. */
export const SourceSchema = z.object({
  url: z.string().url('Source URL must be valid'),
  title: z.string().min(1, 'Source title is required'),
  snippet: z.string().optional(),
});

export type Source = z.infer<typeof SourceSchema>;

/** A single factual finding written to the blackboard by an agent. */
export const FindingSchema = z.object({
  id: z.string().min(1),
  agentId: AgentIdSchema,
  claim: z.string().min(1, 'A finding must state a claim'),
  evidence: z.string().min(1, 'A finding must carry evidence'),
  sources: z.array(SourceSchema).default([]),
  createdAt: z.string().datetime({ offset: true }),
});

export type Finding = z.infer<typeof FindingSchema>;

/** An explicit objection raised by one agent against another agent's stance. */
export const ObjectionSchema = z.object({
  against: AgentIdSchema,
  point: z.string().min(1, 'An objection must state a point'),
});

export type Objection = z.infer<typeof ObjectionSchema>;

export const StanceSchema = z.enum(['supports', 'concerns', 'mixed']);

export type Stance = z.infer<typeof StanceSchema>;

/** A debate position published by an agent for a given round. */
export const PositionSchema = z.object({
  id: z.string().min(1),
  agentId: AgentIdSchema,
  round: z.number().int().positive(),
  stance: StanceSchema,
  headline: z.string().min(1, 'A position needs a headline'),
  argument: z.string().min(1, 'A position needs an argument'),
  objections: z.array(ObjectionSchema).default([]),
  supportingFindingIds: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
  createdAt: z.string().datetime({ offset: true }),
});

export type Position = z.infer<typeof PositionSchema>;

/** A human arbitration directive injected into the blackboard mid-debate. */
export const ArbitrationSchema = z.object({
  id: z.string().min(1),
  directive: z.string().min(1, 'A directive cannot be empty'),
  targetAgent: AgentIdSchema.optional(),
  createdAt: z.string().datetime({ offset: true }),
});

export type Arbitration = z.infer<typeof ArbitrationSchema>;

export const VerdictRecommendationSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  owner: AgentIdSchema,
});

export type VerdictRecommendation = z.infer<typeof VerdictRecommendationSchema>;

export const VerdictRiskSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
});

export type VerdictRisk = z.infer<typeof VerdictRiskSchema>;

/** The final, Zod-validated verdict produced by the council. */
export const VerdictSchema = z.object({
  summary: z.string().min(1, 'A verdict needs a summary'),
  recommendations: z.array(VerdictRecommendationSchema).default([]),
  risks: z.array(VerdictRiskSchema).default([]),
  sources: z.array(SourceSchema).default([]),
  confidence: z.number().min(0).max(100),
});

export type Verdict = z.infer<typeof VerdictSchema>;

export const LogKindSchema = z.enum(['phase', 'agent', 'human', 'system', 'error']);

export type LogKind = z.infer<typeof LogKindSchema>;

/** Append-only activity log entry on the blackboard. */
export const LogEntrySchema = z.object({
  id: z.string().min(1),
  at: z.string().datetime({ offset: true }),
  kind: LogKindSchema,
  agentId: AgentIdSchema.optional(),
  message: z.string().min(1),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

/** Per-session configuration chosen by the human when convening the council. */
export const SessionConfigSchema = z.object({
  agents: z.array(AgentIdSchema).min(2).default(['tech', 'finance', 'risk', 'strategy']),
  debateRounds: z.number().int().min(1).max(4).default(2),
  requireArbitration: z.boolean().default(true),
  model: z.string().optional(),
});

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

/** A council session (the persistent header of a debate). */
export const SessionSchema = z.object({
  id: z.string().uuid('session id must be a UUID'),
  topic: z.string().min(3, 'Topic is too short'),
  context: z.string().default(''),
  status: PhaseSchema,
  config: SessionConfigSchema,
  error: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Session = z.infer<typeof SessionSchema>;

/**
 * The shared blackboard: the single source of truth that agents read and
 * write. Agents never exchange messages directly — the orchestrator reads
 * this state and distributes the floor, which keeps the debate stable.
 */
export const BlackboardStateSchema = z.object({
  sessionId: z.string().uuid('session id must be a UUID'),
  findings: z.array(FindingSchema).default([]),
  positions: z.array(PositionSchema).default([]),
  arbitrations: z.array(ArbitrationSchema).default([]),
  verdict: VerdictSchema.nullable().default(null),
  log: z.array(LogEntrySchema).default([]),
  updatedAt: z.string().datetime({ offset: true }),
});

export type BlackboardState = z.infer<typeof BlackboardStateSchema>;
