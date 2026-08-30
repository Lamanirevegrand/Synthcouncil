import type { BlackboardState, Session } from '@synthcouncil/schemas';
import { newUuid, nowIso } from '../utils/ids.js';
import { emptyBlackboard } from '../orchestrator/blackboard.js';
import type { CouncilStore, CreateSessionRecord } from './types.js';

interface MemoryRecord {
  session: Session;
  blackboard: BlackboardState;
}

/** In-memory store — used when no Supabase credentials are configured. */
export function createMemoryStore(): CouncilStore {
  const records = new Map<string, MemoryRecord>();

  return {
    mode: 'memory',

    async createSession(record: CreateSessionRecord): Promise<Session> {
      const now = nowIso();
      const session: Session = {
        id: newUuid(),
        topic: record.topic,
        context: record.context ?? '',
        status: 'created',
        config: record.config,
        createdAt: now,
        updatedAt: now,
      };
      records.set(session.id, { session, blackboard: emptyBlackboard(session.id) });
      return session;
    },

    async getSession(id: string): Promise<Session | null> {
      return records.get(id)?.session ?? null;
    },

    async updateSession(id: string, patch: Partial<Pick<Session, 'status' | 'error'>>): Promise<Session> {
      const record = records.get(id);
      if (!record) throw new Error(`Session not found: ${id}`);
      record.session = {
        ...record.session,
        ...patch,
        updatedAt: nowIso(),
        error: patch.error ?? (patch.status !== 'error' ? undefined : record.session.error),
      };
      return record.session;
    },

    async getBlackboard(id: string): Promise<BlackboardState | null> {
      return records.get(id)?.blackboard ?? null;
    },

    async saveBlackboard(id: string, board: BlackboardState): Promise<BlackboardState> {
      const record = records.get(id);
      if (!record) throw new Error(`Session not found: ${id}`);
      record.blackboard = board;
      return board;
    },
  };
}
