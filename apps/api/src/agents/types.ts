import type { AgentId } from '@synthcouncil/schemas';

export interface AgentDefinition {
  id: AgentId;
  label: string;
  roleLabel: string;
  emoji: string;
  color: string;
  persona: string;
  investigationRules: string;
  debateRules: string;
}
