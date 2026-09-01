import type { BlackboardState, Session } from '@synthcouncil/schemas';
import { VerdictOutputSchema } from '@synthcouncil/schemas';
import type { AgentDefinition } from '../agents/types.js';
import { getAgent } from '../agents/registry.js';

/**
 * Final synthesis step: the Strategy Chair reads the whole blackboard
 * (findings, positions, directives) and writes the Zod-validated verdict.
 */

export function buildSynthesisSystem(chair: AgentDefinition): string {
  return [
    chair.persona,
    'You are now chairing the FINAL SYNTHESIS of the council debate.',
    'Your verdict must:',
    '- Resolve the disagreement into a decisive, phased recommendation set (build → validate → scale),',
    '- Name the top risks explicitly, with severities, and never bury them in optimism,',
    '- Attribute every recommendation to one council member (owner: tech|finance|risk|strategy),',
    '- Cite ONLY the URLs listed in "SOURCES YOU MAY CITE" — never invent a URL or a title,',
    '- Give an honest confidence score (0-100) reflecting how much evidence the council gathered.',
    'Produce strictly-typed JSON. Contract:',
    JSON.stringify(
      {
        summary: 'the verdict, in a few paragraphs',
        recommendations: [{ title: '…', detail: '…', owner: 'tech' }],
        risks: [{ title: '…', detail: '…', severity: 'low|medium|high' }],
        sources: [{ url: 'https://…', title: '…' }],
        confidence: 0,
      },
      null,
      2
    ),
    'Respond with ONLY a valid JSON object.',
  ].join('\n\n');
}

export function buildSynthesisUser(
  session: Session,
  board: BlackboardState,
  allowedSources: Array<{ url: string; title: string }>
): string {
  const findings = board.findings.map(
    (finding) => `- [${finding.id}] (${finding.agentId}) ${finding.claim}\n  ${finding.evidence}`
  );
  const positions = board.positions.map(
    (position) =>
      `### ${position.agentId} round ${position.round}: ${position.headline}\n${position.argument}` +
      (position.objections.length
        ? `\nObjections: ${position.objections.map((o) => `${o.against} — ${o.point}`).join(' | ')}`
        : '')
  );
  const directives = board.arbitrations.map((arbitration) => `- ${arbitration.directive}`);

  return [
    `PROBLEM STATEMENT\n${session.topic}`,
    '',
    'ADDITIONAL CONTEXT',
    session.context.trim() || 'None provided.',
    '',
    'HUMAN DIRECTIVES',
    directives.length ? directives.join('\n') : 'None.',
    '',
    'FINDINGS ON THE BLACKBOARD',
    findings.join('\n'),
    '',
    'POSITIONS ON THE BLACKBOARD',
    positions.join('\n\n'),
    '',
    'SOURCES YOU MAY CITE (never invent URLs or titles — use ONLY entries from this list)',
    allowedSources.length
      ? allowedSources.map((source) => `- "${source.title}" — ${source.url}`).join('\n')
      : 'No sources were collected for this debate — leave the sources array empty.',
    '',
    'Deliver the final verdict JSON now.',
  ].join('\n');
}

export function createSynthesis(ownerId: 'strategy' = 'strategy') {
  return {
    schema: VerdictOutputSchema,
    chair: getAgent(ownerId),
  };
}
