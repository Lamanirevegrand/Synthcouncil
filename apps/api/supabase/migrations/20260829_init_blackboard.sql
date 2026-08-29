-- Table pour stocker l'état du Tableau Noir (Blackboard)
CREATE TABLE blackboard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'idle',
    original_query TEXT NOT NULL,
    contributions JSONB NOT NULL DEFAULT '[]'::jsonb,
    human_redirects JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note de sécurité : L'accès RLS (Row Level Security) est désactivé ici 
-- car seul notre backend sécurisé par Service Key manipulera ces données.