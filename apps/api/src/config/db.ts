import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Utilisation de la Service Key car ce client tourne côté serveur (Render)
// et doit avoir un accès total en écriture au Tableau Noir.
export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            persistSession: false, // Inutile côté serveur backend
            autoRefreshToken: false,
        }
    }
);