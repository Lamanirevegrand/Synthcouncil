import type { AgentId } from '@synthcouncil/schemas';
import { AGENT_META } from '../lib/agents';

export default function AgentBadge({ agentId }: { agentId: AgentId }) {
  const meta = AGENT_META[agentId];
  return (
    <span
      className="agent-badge"
      style={{ ['--agent-color' as string]: meta.color }}
      title={meta.role}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
