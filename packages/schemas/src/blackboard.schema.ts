import { z } from 'zod';
import { AgentResponseSchema } from './agent-response.schema.js';

// Machine à états stricte pour l'Orchestrateur
export const BlackboardStatusSchema = z.enum([
    'idle',             // En attente
    'orchestrating',    // Les agents travaillent
    'awaiting_human',   // Pause : attente de l'arbitrage humain
    'resolved',         // Débat terminé, verdict généré
    'failed'            // Erreur critique (timeout, erreur API)
]);

export const BlackboardStateSchema = z.object({
    sessionId: z.string().uuid("Le sessionId doit être un UUID valide"),
    status: BlackboardStatusSchema,
    originalQuery: z.string().min(10, "La requête initiale est trop courte"),

    // On réutilise ton schéma existant pour standardiser les réponses des agents
    contributions: z.array(AgentResponseSchema).default([]),

    // Historique des interventions humaines pour réorienter le débat
    humanRedirects: z.array(z.string()).default([]),

    // Horodatage strict pour la gestion des timeouts
    updatedAt: z.string().datetime("Format ISO 8601 requis"),
});

export type BlackboardStatus = z.infer<typeof BlackboardStatusSchema>;
export type BlackboardState = z.infer<typeof BlackboardStateSchema>;