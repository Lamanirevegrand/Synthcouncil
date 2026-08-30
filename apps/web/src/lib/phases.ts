import type { Phase } from '@synthcouncil/schemas';

export const PHASE_LABEL: Record<Phase, string> = {
  created: 'Created',
  investigating: 'Investigating',
  debating: 'Debating',
  arbitrating: 'Awaiting arbiter',
  synthesizing: 'Synthesizing',
  complete: 'Verdict',
  error: 'Error',
};

export const PHASE_ORDER: Phase[] = [
  'created',
  'investigating',
  'debating',
  'arbitrating',
  'synthesizing',
  'complete',
];
