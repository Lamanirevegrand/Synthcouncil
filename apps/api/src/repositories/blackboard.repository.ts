import { supabase } from '../config/db.js';
import { BlackboardStateSchema, type BlackboardState } from '@synthcouncil/schemas';

export const blackboardRepository = {
    /**
     * Crée une nouvelle session de débat dans la base de données.
     */
    async createSession(query: string): Promise<BlackboardState> {
        const { data, error } = await supabase
            .from('blackboard_sessions')
            .insert({
                original_query: query,
                status: 'orchestrating'
            })
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Database Error: Failed to create session - ${error?.message}`);
        }

        // Mapping strict DB (snake_case) vers App (camelCase)
        return BlackboardStateSchema.parse({
            sessionId: data.id,
            status: data.status,
            originalQuery: data.original_query,
            contributions: data.contributions,
            humanRedirects: data.human_redirects,
            updatedAt: data.updated_at
        });
    },

    /**
     * Récupère une session existante.
     */
    async getSession(sessionId: string): Promise<BlackboardState | null> {
        const { data, error } = await supabase
            .from('blackboard_sessions')
            .select()
            .eq('id', sessionId)
            .single();

        if (error || !data) {
            return null; // Retourne null si introuvable, laisse le routeur gérer la 404
        }

        return BlackboardStateSchema.parse({
            sessionId: data.id,
            status: data.status,
            originalQuery: data.original_query,
            contributions: data.contributions,
            humanRedirects: data.human_redirects,
            updatedAt: data.updated_at
        });
    },

    /**
     * Met à jour une session existante (ajout de contributions, changement de statut).
     */
    async updateSession(
        sessionId: string,
        updates: Partial<Pick<BlackboardState, 'status' | 'contributions' | 'humanRedirects'>>
    ): Promise<BlackboardState> {

        // Typage strict pour la payload de mise à jour Supabase (snake_case)
        const dbPayload: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        };

        // Mapping inverse : on traduit le camelCase de l'app vers le snake_case de la DB
        if (updates.status) dbPayload.status = updates.status;
        if (updates.contributions) dbPayload.contributions = updates.contributions;
        if (updates.humanRedirects) dbPayload.human_redirects = updates.humanRedirects;

        const { data, error } = await supabase
            .from('blackboard_sessions')
            .update(dbPayload)
            .eq('id', sessionId)
            .select()
            .single();

        if (error || !data) {
            throw new Error(`Database Error: Failed to update session ${sessionId} - ${error?.message}`);
        }

        // On re-valide la donnée sortante de la DB avec Zod pour garantir l'intégrité
        return BlackboardStateSchema.parse({
            sessionId: data.id,
            status: data.status,
            originalQuery: data.original_query,
            contributions: data.contributions,
            humanRedirects: data.human_redirects,
            updatedAt: data.updated_at
        });
    }
};