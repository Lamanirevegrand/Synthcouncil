import { z } from 'zod';
import { ArbitrationSchema, FindingSchema, LogEntrySchema, PhaseSchema, PositionSchema, VerdictSchema } from './blackboard.schema.js';

/**
 * Server-Sent Events emitted by the engine while a council session runs.
 * The web client consumes these over `GET /api/sessions/:id/events`.
 */
export const PhaseEventSchema = z.object({ type: z.literal('phase'), phase: PhaseSchema });
export const FindingEventSchema = z.object({ type: z.literal('finding'), finding: FindingSchema });
export const PositionEventSchema = z.object({ type: z.literal('position'), position: PositionSchema });
export const ArbitrationRequestEventSchema = z.object({
  type: z.literal('arbitration_request'),
  message: z.string(),
});
export const ArbitrationEventSchema = z.object({ type: z.literal('arbitration'), arbitration: ArbitrationSchema });
export const LogEventSchema = z.object({ type: z.literal('log'), entry: LogEntrySchema });
export const VerdictEventSchema = z.object({ type: z.literal('verdict'), verdict: VerdictSchema });
export const ErrorEventSchema = z.object({ type: z.literal('error'), message: z.string() });

export const CouncilEventSchema = z.discriminatedUnion('type', [
  PhaseEventSchema,
  FindingEventSchema,
  PositionEventSchema,
  ArbitrationRequestEventSchema,
  ArbitrationEventSchema,
  LogEventSchema,
  VerdictEventSchema,
  ErrorEventSchema,
]);

export type CouncilEvent = z.infer<typeof CouncilEventSchema>;
export type CouncilEventType = CouncilEvent['type'];
