import type { AgentId } from '@synthcouncil/schemas';

export interface AgentMeta {
  id: AgentId;
  label: string;
  role: string;
  emoji: string;
  color: string;
}

export const AGENT_META: Record<AgentId, AgentMeta> = {
  tech: { id: 'tech', label: 'Tech', role: 'Lead Systems Architect', emoji: '⚙️', color: '#38bdf8' },
  finance: { id: 'finance', label: 'Finance', role: 'Chief Financial Officer', emoji: '💰', color: '#34d399' },
  risk: { id: 'risk', label: 'Risk', role: 'Risk & Compliance Counsel', emoji: '🛡️', color: '#f87171' },
  strategy: { id: 'strategy', label: 'Strategy', role: 'Strategy Chair', emoji: '🧭', color: '#c084fc' },
};

export const AGENT_ORDER: AgentId[] = ['tech', 'finance', 'risk', 'strategy'];
