import type { AgentId, BlackboardState, Session } from '@synthcouncil/schemas';
import { API_ENDPOINTS } from '../env';

export interface SessionSnapshot {
  session: Session;
  blackboard: BlackboardState;
}

export interface CreateSessionPayload {
  topic: string;
  context?: string;
  agents?: AgentId[];
  debateRounds?: number;
  requireArbitration?: boolean;
}

export interface ArbitratePayload {
  directive?: string;
  targetAgent?: AgentId;
  proceed?: boolean;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiClientError('Cannot reach the SynthCouncil engine. Is the API running?');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let details: unknown;
    try {
      const body = (await response.json()) as { error?: string; message?: string; details?: unknown };
      message = body.error ?? body.message ?? message;
      details = body.details;
    } catch {
      /* keep default message */
    }
    throw new ApiClientError(message, response.status, details);
  }

  return (await response.json()) as T;
}

export const api = {
  async createSession(payload: CreateSessionPayload): Promise<{ session: Session }> {
    return request(API_ENDPOINTS.sessions, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getSession(id: string): Promise<SessionSnapshot> {
    return request(API_ENDPOINTS.session(id));
  },

  async startSession(id: string): Promise<{ sessionId: string; status: string; message: string }> {
    return request(API_ENDPOINTS.start(id), { method: 'POST' });
  },

  async arbitrate(id: string, payload: ArbitratePayload): Promise<{ sessionId: string; status: string }> {
    return request(API_ENDPOINTS.arbitrate(id), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
