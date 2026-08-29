import { z } from 'zod';

export const AgentResponseSchema = z.object({
    agentId: z.enum(['tech', 'finance', 'risk']),
    confidenceScore: z.number().min(0).max(100),
    verdict: z.string().min(10),
    sources: z.array(z.string().url()).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;