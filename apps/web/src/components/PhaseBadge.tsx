import type { Phase } from '@synthcouncil/schemas';
import { PHASE_LABEL } from '../lib/phases';

const TONE: Record<Phase, string> = {
  created: 'neutral',
  investigating: 'active',
  debating: 'active',
  arbitrating: 'waiting',
  synthesizing: 'active',
  complete: 'done',
  error: 'error',
};

export default function PhaseBadge({ phase }: { phase: Phase }) {
  return <span className={`phase-badge phase-${TONE[phase] ?? 'neutral'}`}>{PHASE_LABEL[phase]}</span>;
}
