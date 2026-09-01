import type {
  Arbitration,
  Finding,
  Position,
} from '@synthcouncil/schemas';
import {
  InvestigationOutputSchema,
  PositionOutputSchema,
  QueryPlanSchema,
  type QueryPlan,
} from '@synthcouncil/schemas';
import type { EvidenceProvider } from '../evidence/types.js';
import type { LlmClient } from '../llm/client.js';
import { normalizeSource, restrictSourcesToAllowlist, type KnownSource } from '../llm/json.js';
import { createId, nowIso } from '../utils/ids.js';
import type { AgentDefinition } from './types.js';

export interface DebateContext {
  topic: string;
  context: string;
  round: number;
  arbitrations: Arbitration[];
  ownFindings: Finding[];
  otherPositions: Position[];
}

const MAX_QUERIES = 3;
const RESULTS_PER_QUERY = 5;
const PAGES_PER_QUERY = 3;
const MAX_UNIQUE_DOMAINS = 6;

/**
 * Step 1 of the investigation DAG: the agent designs its own search plan.
 */
export async function planQueries(agent: AgentDefinition, llm: LlmClient, topic: string): Promise<QueryPlan> {
  const system = [
    agent.persona,
    'You are planning a web investigation. Design 2-3 concrete search queries that will surface OFFICIAL documentation, pricing pages, legal texts and reputable sources for the problem below.',
    'Respond with ONLY a valid JSON object matching: {"queries": ["...", "..."]}.',
  ].join('\n\n');

  const user = `PROBLEM STATEMENT\n${topic}\n\nProduce your search queries.`;

  return llm.completeJson({ system, user, schema: QueryPlanSchema, temperature: 0.5 });
}

/**
 * Step 2: run the queries, fetch the best pages, and have the agent write
 * Zod-validated findings grounded ONLY in the collected evidence pack.
 */
export async function runInvestigation(
  agent: AgentDefinition,
  llm: LlmClient,
  evidence: EvidenceProvider,
  topic: string,
  context: string
): Promise<{ findings: Finding[]; queries: string[]; evidenceCount: number }> {
  const plan = await planQueries(agent, llm, topic);
  const queries = plan.queries.slice(0, MAX_QUERIES);

  const pack = await collectEvidencePack(evidence, queries);
  const packText = renderEvidencePack(pack);

  // Hard allowlist: a claim may only cite URLs the engine actually collected
  // (search results + fetched pages). Anything else is stripped below.
  const allowlist = collectPackAllowlist(pack);

  const system = [
    agent.persona,
    agent.investigationRules,
    'Produce your investigation as strictly-typed JSON. Contract:',
    JSON.stringify(
      {
        summary: 'one-paragraph synthesis of your investigation',
        claims: [
          {
            claim: 'a single factual, falsifiable claim',
            evidence: 'the evidence you found supporting it',
            sources: [{ url: 'https://…', title: '…', snippet: 'optional' }],
          },
        ],
        openQuestions: ['what evidence is still missing'],
      },
      null,
      2
    ),
    'Rules: cite ONLY sources listed in the EVIDENCE PACK; never invent URLs, fees, statutes or market numbers; when evidence is missing, say so.',
    'Respond with ONLY a valid JSON object.',
  ].join('\n\n');

  const user = [
    'PROBLEM STATEMENT',
    topic,
    '',
    'ADDITIONAL CONTEXT',
    context.trim() || 'None provided.',
    '',
    'EVIDENCE PACK',
    packText || 'No evidence could be collected (network or source failure). Base your claims on reasoning and mark every claim as unverified.',
    '',
    'Deliver your investigation JSON now.',
  ].join('\n');

  const output = await llm.completeJson({ system, user, schema: InvestigationOutputSchema, temperature: 0.3 });

  const findings: Finding[] = output.claims.map((claim, index) => ({
    id: createId(`${agent.id}-finding`),
    agentId: agent.id,
    claim: claim.claim,
    evidence: claim.evidence,
    sources: restrictSourcesToAllowlist(claim.sources, allowlist),
    createdAt: nowIso(),
  }));

  if (findings.length === 0) {
    findings.push({
      id: createId(`${agent.id}-finding`),
      agentId: agent.id,
      claim: `${agent.label} could not establish any evidence-backed claim.`,
      evidence: output.summary,
      sources: [],
      createdAt: nowIso(),
    });
  }

  return { findings, queries, evidenceCount: pack.reduce((total, item) => total + item.results.length, 0) };
}

/**
 * Step 3 (debate rounds): the agent reads the blackboard — other positions,
 * its own findings and any human directives — and publishes an adversarial
 * position for the round.
 */
export async function runDebatePosition(
  agent: AgentDefinition,
  llm: LlmClient,
  ctx: DebateContext
): Promise<Position> {
  const otherPositionsText = renderOtherPositions(ctx);
  const ownFindingsText = renderOwnFindings(ctx);
  const directivesText =
    ctx.arbitrations.length > 0
      ? ctx.arbitrations.map((arbitration) => `- ${arbitration.directive}${arbitration.targetAgent ? ` (directed at ${arbitration.targetAgent})` : ''}`).join('\n')
      : 'None yet — the council is still autonomous.';

  // Hard allowlist: a position may only cite sources already on the blackboard
  // (the agent's own findings or other agents' published positions).
  const allowlist = collectDebateAllowlist(ctx);

  const system = [
    agent.persona,
    agent.debateRules,
    'Publish your position as strictly-typed JSON. Contract:',
    JSON.stringify(
      {
        stance: 'supports | concerns | mixed',
        headline: 'short headline for your position',
        argument: 'full argument, evidence-backed',
        objections: [{ against: 'tech|finance|risk|strategy', point: 'the specific point you attack' }],
        supportingFindingIds: ['ids of findings that support you (from YOUR FINDINGS below)'],
        sources: [{ url: 'https://…', title: '…' }],
      },
      null,
      2
    ),
    'Rules: be adversarial but factual; cite ONLY URLs from YOUR FINDINGS or other agents\' positions; explicitly attack weak points in other positions; never manufacture consensus.',
    'Respond with ONLY a valid JSON object.',
  ].join('\n\n');

  const user = [
    `YOU ARE THE ${agent.roleLabel.toUpperCase()}`,
    '',
    `PROBLEM STATEMENT\n${ctx.topic}`,
    '',
    'ADDITIONAL CONTEXT',
    ctx.context.trim() || 'None provided.',
    '',
    'HUMAN DIRECTIVES',
    directivesText,
    '',
    'YOUR FINDINGS',
    ownFindingsText || 'You have no findings yet.',
    '',
    otherPositionsText || 'No other positions published yet.',
    '',
    `This is debate round ${ctx.round}. Deliver your position JSON now.`,
  ].join('\n');

  const output = await llm.completeJson({ system, user, schema: PositionOutputSchema, temperature: 0.6 });

  // Only reference findings that actually exist in this agent's findings —
  // a model cannot point at a finding id that was never published.
  const ownFindingIds = new Set(ctx.ownFindings.map((finding) => finding.id));

  return {
    id: createId(`${agent.id}-position`),
    agentId: agent.id,
    round: ctx.round,
    stance: output.stance,
    headline: output.headline,
    argument: output.argument,
    objections: output.objections,
    supportingFindingIds: output.supportingFindingIds.filter((id) => ownFindingIds.has(id)),
    sources: restrictSourcesToAllowlist(output.sources, allowlist),
    createdAt: nowIso(),
  };
}

// ---------------------------------------------------------------------------
// Evidence collection and rendering
// ---------------------------------------------------------------------------

interface CollectedPackItem {
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
  pages: Array<{ url: string; title: string; content: string }>;
}

async function collectEvidencePack(evidence: EvidenceProvider, queries: string[]): Promise<CollectedPackItem[]> {
  const seenDomains = new Set<string>();
  const pack: CollectedPackItem[] = [];

  for (const query of queries) {
    let results: Awaited<ReturnType<EvidenceProvider['search']>> = [];
    try {
      results = await evidence.search(query, RESULTS_PER_QUERY);
    } catch (error) {
      console.warn(`[evidence] search failed for "${query}": ${error instanceof Error ? error.message : error}`);
    }

    const pages: Array<{ url: string; title: string; content: string }> = [];
    for (const result of results.slice(0, PAGES_PER_QUERY)) {
      let domain: string;
      try {
        domain = new URL(result.url).hostname;
      } catch {
        continue;
      }
      if (seenDomains.size >= MAX_UNIQUE_DOMAINS || seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      try {
        const page = await evidence.fetchPage(result.url);
        pages.push({ url: page.url, title: page.title, content: page.content });
      } catch (error) {
        console.warn(`[evidence] fetch failed for ${result.url}: ${error instanceof Error ? error.message : error}`);
      }
    }

    pack.push({ query, results, pages });
  }

  return pack;
}

function collectPackAllowlist(pack: CollectedPackItem[]): Map<string, KnownSource> {
  const allowlist = new Map<string, KnownSource>();
  for (const item of pack) {
    for (const result of item.results) {
      const known = normalizeSource({ url: result.url, title: result.title, snippet: result.snippet });
      if (known && !allowlist.has(known.url)) allowlist.set(known.url, known);
    }
    // Fetched pages may end at a redirected URL — both the search-result URL
    // and the final page URL are legitimate citations.
    for (const page of item.pages) {
      const known = normalizeSource({ url: page.url, title: page.title });
      if (known && !allowlist.has(known.url)) allowlist.set(known.url, known);
    }
  }
  return allowlist;
}

function collectDebateAllowlist(ctx: DebateContext): Map<string, KnownSource> {
  const allowlist = new Map<string, KnownSource>();
  for (const finding of ctx.ownFindings) {
    for (const source of finding.sources) {
      const known = normalizeSource(source);
      if (known && !allowlist.has(known.url)) allowlist.set(known.url, known);
    }
  }
  for (const position of ctx.otherPositions) {
    for (const source of position.sources) {
      const known = normalizeSource(source);
      if (known && !allowlist.has(known.url)) allowlist.set(known.url, known);
    }
  }
  return allowlist;
}

function renderEvidencePack(pack: CollectedPackItem[]): string {
  if (pack.length === 0) return '';
  const blocks: string[] = [];
  let counter = 0;
  for (const item of pack) {
    blocks.push(`Queries: ${item.query}`);
    for (const result of item.results) {
      counter += 1;
      blocks.push(`[${counter}] "${result.title}" — ${result.url}\n${result.snippet}`);
    }
    for (const page of item.pages) {
      counter += 1;
      blocks.push(`[${counter}] FULL PAGE: "${page.title}" — ${page.url}\n${page.content}`);
    }
  }
  return blocks.join('\n\n');
}

function renderOwnFindings(ctx: DebateContext): string {
  return ctx.ownFindings
    .map((finding) => `- [${finding.id}] ${finding.claim}\n  Evidence: ${finding.evidence}`)
    .join('\n');
}

function renderOtherPositions(ctx: DebateContext): string {
  return ctx.otherPositions
    .map(
      (position) =>
        `### ${position.agentId} (round ${position.round})\n${position.headline}: ${position.argument}` +
        (position.objections.length > 0
          ? `\nObjections raised: ${position.objections.map((o) => `${o.against} — ${o.point}`).join(' | ')}`
          : '')
    )
    .join('\n\n');
}
