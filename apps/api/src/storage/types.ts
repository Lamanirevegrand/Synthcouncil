import type { BlackboardState, Session } from '@synthcouncil/schemas';

export interface CreateSessionRecord {
  topic: string;
  context?: string;
  config: Session['config'];
}

/**
 * Persistence contract. The engine only talks to this interface, so the
 * database can be swapped (memory for dev, Supabase for production) without
 * touching orchestration logic.
 */
export interface CouncilStore {
  readonly mode: string;
  createSession(record: CreateSessionRecord): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, patch: Partial<Pick<Session, 'status' | 'error'>>): Promise<Session>;
  getBlackboard(id: string): Promise<BlackboardState | null>;
  saveBlackboard(id: string, board: BlackboardState): Promise<BlackboardState>;
}
