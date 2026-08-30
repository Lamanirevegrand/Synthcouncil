import type { BlackboardState, Session } from '@synthcouncil/schemas';
import { SessionSchema } from '@synthcouncil/schemas';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { nowIso } from '../utils/ids.js';
import type { CouncilStore, CreateSessionRecord } from './types.js';

interface SessionRow {
  id: string;
  topic: string;
  context: string;
  status: Session['status'];
  config: Session['config'];
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface BlackboardRow {
  session_id: string;
  data: BlackboardState;
  updated_at: string;
}

const SESSION_SELECT = 'id, topic, context, status, config, error, created_at, updated_at';

/** Supabase (PostgreSQL) store — used in production via the service key. */
export function createSupabaseStore(url: string, serviceKey: string): CouncilStore {
  const client: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rowToSession = (row: SessionRow): Session =>
    SessionSchema.parse({
      id: row.id,
      topic: row.topic,
      context: row.context,
      status: row.status,
      config: row.config,
      error: row.error ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

  const throwDb = (operation: string, message?: string): never => {
    throw new Error(`Database error during ${operation}${message ? `: ${message}` : ''}`);
  };

  const assertData = <T,>(data: T | null, error: { message?: string } | null, operation: string): T => {
    if (error || !data) {
      throw new Error(`Database error during ${operation}${error?.message ? `: ${error.message}` : ''}`);
    }
    return data;
  };

  return {
    mode: 'supabase',

    async createSession(record: CreateSessionRecord): Promise<Session> {
      const now = nowIso();
      const { data, error } = await client
        .from('sessions')
        .insert({
          topic: record.topic,
          context: record.context ?? '',
          status: 'created',
          config: record.config,
          created_at: now,
          updated_at: now,
        })
        .select(SESSION_SELECT)
        .single<SessionRow>();

      if (error || !data) throwDb('createSession', error?.message);
      return rowToSession(assertData(data, error, 'createSession'));
    },

    async getSession(id: string): Promise<Session | null> {
      const { data, error } = await client
        .from('sessions')
        .select(SESSION_SELECT)
        .eq('id', id)
        .maybeSingle<SessionRow>();

      if (error) throwDb('getSession', error.message);
      return data ? rowToSession(data) : null;
    },

    async updateSession(id: string, patch: Partial<Pick<Session, 'status' | 'error'>>): Promise<Session> {
      const payload: Partial<Record<string, unknown>> = { updated_at: nowIso() };
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.error !== undefined) payload.error = patch.error ?? null;

      const { data, error } = await client
        .from('sessions')
        .update(payload)
        .eq('id', id)
        .select(SESSION_SELECT)
        .single<SessionRow>();

      if (error || !data) throwDb('updateSession', error?.message);
      return rowToSession(assertData(data, error, 'updateSession'));
    },

    async getBlackboard(id: string): Promise<BlackboardState | null> {
      const { data, error } = await client
        .from('blackboards')
        .select('session_id, data, updated_at')
        .eq('session_id', id)
        .maybeSingle<BlackboardRow>();

      if (error) throwDb('getBlackboard', error.message);
      return data?.data ?? null;
    },

    async saveBlackboard(id: string, board: BlackboardState): Promise<BlackboardState> {
      const { error } = await client.from('blackboards').upsert(
        {
          session_id: id,
          data: board,
          updated_at: nowIso(),
        },
        { onConflict: 'session_id' }
      );

      if (error) throwDb('saveBlackboard', error.message);
      return board;
    },
  };
}
