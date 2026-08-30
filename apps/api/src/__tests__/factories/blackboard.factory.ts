import { randomUUID } from 'crypto';

// Factory pour générer un mock de retour Supabase (format snake_case)
export const createMockDbSession = (overrides?: Partial<Record<string, unknown>>) => ({
    id: randomUUID(),
    status: 'orchestrating',
    original_query: 'Default test query for the SynthCouncil',
    contributions: [],
    human_redirects: [],
    updated_at: new Date().toISOString(),
    ...overrides // Permet d'écraser des valeurs spécifiques pour un test précis
});