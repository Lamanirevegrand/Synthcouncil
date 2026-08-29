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
    }
};