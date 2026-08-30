/**
 * API base URL for the SynthCouncil engine.
 * Set PUBLIC_API_URL at build time (Netlify env var) to the Render API,
 * e.g. https://synthcouncil-api.onrender.com/api
 */
const raw = import.meta.env.PUBLIC_API_URL as string | undefined;

export const API_BASE = (raw?.trim() ?? 'http://localhost:4000/api').replace(/\/+$/, '');

export const API_ENDPOINTS = {
  sessions: `${API_BASE}/sessions`,
  session: (id: string) => `${API_BASE}/sessions/${id}`,
  start: (id: string) => `${API_BASE}/sessions/${id}/start`,
  arbitrate: (id: string) => `${API_BASE}/sessions/${id}/arbitrate`,
  events: (id: string) => `${API_BASE}/sessions/${id}/events`,
};
