import type { AgentId } from '@synthcouncil/schemas';
import { financeAgent } from './finance.agent.js';
import { riskAgent } from './risk.agent.js';
import { strategyAgent } from './strategy.agent.js';
import { techAgent } from './tech.agent.js';
import type { AgentDefinition } from './types.js';

/**
 * The council roster. Adding a new expert (Legal, Marketing, ...) is a single
 * file injection: create the agent module and register it here — the engine
 * and contracts never change.
 */
export const AGENT_REGISTRY: Record<AgentId, AgentDefinition> = {
  tech: techAgent,
  finance: financeAgent,
  risk: riskAgent,
  strategy: strategyAgent,
};

export function getAgent(id: AgentId): AgentDefinition {
  return AGENT_REGISTRY[id];
}

export function getAgents(ids: AgentId[]): AgentDefinition[] {
  return ids.map(getAgent);
}
