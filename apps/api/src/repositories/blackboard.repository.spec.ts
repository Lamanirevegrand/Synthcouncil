import { describe, it, expect, vi } from 'vitest';
import { blackboardRepository } from './blackboard.repository.js';
import { supabase } from '../config/db.js';
import { createMockDbSession } from '../__tests__/factories/blackboard.factory.js';

vi.mock('../config/db.js', () => ({
    supabase: {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
    }
}));

describe('Blackboard Repository', () => {
    it('should map snake_case from DB to camelCase using Zod successfully', async () => {
        // 1. Arrange : On utilise la Factory, plus de hardcodage manuel
        const mockDbResponse = createMockDbSession({
            original_query: 'How to deploy on Render?' // On écrase juste ce qui nous intéresse
        });

        vi.mocked(supabase.from('blackboard_sessions').select().single).mockResolvedValue({
            data: mockDbResponse,
            error: null,
            count: null,
            status: 200,
            statusText: 'OK'
        });

        // 2. Act
        const result = await blackboardRepository.createSession('How to deploy on Render?');

        // 3. Assert
        expect(result.sessionId).toBe(mockDbResponse.id);
        expect(result.originalQuery).toBe(mockDbResponse.original_query);

        // Zod a bien nettoyé le snake_case
        expect((result as Record<string, unknown>).original_query).toBeUndefined();
    });
});