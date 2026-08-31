import { describe, expect, it } from 'vitest';
import type { EvidenceProvider, FetchedPage, SearchResult } from '../evidence/types.js';
import { createLlmClient, type ResolvedLlmConfig } from '../llm/client.js';
import { createMemoryStore } from '../storage/memory.js';
import { ApiError } from '../utils/errors.js';
import { CouncilEngine } from './engine.js';

const MOCK_LLM: ResolvedLlmConfig = {
  provider: 'mock',
  baseUrl: '',
  apiKey: '',
  model: 'test-mock-v1',
  timeoutMs: 5_000,
};

const MOCK_EVIDENCE: EvidenceProvider = {
  mode: 'mock',
  async search(_query: string): Promise<SearchResult[]> {
    return [
      { title: 'Official guide', url: 'https://docs.example.com/guide', snippet: 'Reference documentation.' },
      { title: 'Pricing', url: 'https://docs.example.com/pricing', snippet: 'Fee schedule.' },
    ];
  },
  async fetchPage(url: string): Promise<FetchedPage> {
    return {
      url,
      title: 'Official guide',
      content:
        'This page documents the recommended integration pattern, the pricing tiers and the platform limits relevant to the investigation.',
    };
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForStatus(
  engine: CouncilEngine,
  sessionId: string,
  status: string,
  timeoutMs = 25_000
): Promise<void> {
  const start = Date.now();
  for (;;) {
    const snapshot = await engine.snapshot(sessionId);
    if (snapshot?.session.status === status) return;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for status "${status}" (got "${snapshot?.session.status}")`);
    }
    await sleep(100);
  }
}

function makeEngine(requireArbitration: boolean, debateRounds = 2) {
  const store = createMemoryStore();
  const llm = createLlmClient(MOCK_LLM);
  const engine = new CouncilEngine({ store, llm, evidence: MOCK_EVIDENCE });
  return { store, engine };
}

describe('CouncilEngine (mock LLM + memory store)', () => {
  it('runs the full DAG to completion without an arbitration gate', async () => {
    const { store, engine } = makeEngine(false);
    const session = await store.createSession({
      topic: 'Launch an AI meeting-notes SaaS for small teams',
      config: {
        agents: ['tech', 'finance', 'risk', 'strategy'],
        debateRounds: 2,
        requireArbitration: false,
      },
    });

    await engine.start(session.id);
    await waitForStatus(engine, session.id, 'complete');

    const snapshot = await engine.snapshot(session.id);
    expect(snapshot?.blackboard.findings.length).toBeGreaterThanOrEqual(4);
    expect(snapshot?.blackboard.positions).toHaveLength(8); // 4 agents × 2 rounds
    expect(snapshot?.blackboard.verdict).not.toBeNull();
    expect(snapshot?.blackboard.verdict?.recommendations.length).toBeGreaterThan(0);
    expect(snapshot?.blackboard.verdict?.sources.length).toBeGreaterThan(0);
  });

  it('pauses for the human arbiter and resumes to a verdict', async () => {
    const { store, engine } = makeEngine(true);
    const session = await store.createSession({
      topic: 'Design the freemium pricing model for an AI meeting-notes SaaS',
      config: {
        agents: ['tech', 'finance', 'risk', 'strategy'],
        debateRounds: 2,
        requireArbitration: true,
      },
    });

    const run = engine.start(session.id);
    await waitForStatus(engine, session.id, 'arbitrating');

    const paused = await engine.snapshot(session.id);
    expect(paused?.blackboard.positions).toHaveLength(4); // round 1 only

    await engine.arbitrate(session.id, {
      directive: 'Tech, verify server-side transcription pricing at our projected volume before we lock the freemium tier.',
      targetAgent: 'tech',
    });
    await run;
    await waitForStatus(engine, session.id, 'complete');

    const snapshot = await engine.snapshot(session.id);
    expect(snapshot?.blackboard.arbitrations).toHaveLength(1);
    expect(snapshot?.blackboard.arbitrations[0].targetAgent).toBe('tech');
    expect(snapshot?.blackboard.positions).toHaveLength(8); // round 1 + round 2
    expect(snapshot?.blackboard.verdict?.summary).toContain('Ver');
  });

  it('rejects a double start with a 409 domain error', async () => {
    const { store, engine } = makeEngine(false);
    const session = await store.createSession({
      topic: 'Short topic for the double-start test',
      config: { agents: ['tech', 'finance'], debateRounds: 1, requireArbitration: false },
    });

    const firstRun = engine.start(session.id);
    await expect(engine.start(session.id)).rejects.toBeInstanceOf(ApiError);
    await firstRun;
    await waitForStatus(engine, session.id, 'complete');
  });

  it('runs all 4 configured rounds without an arbitration gate', async () => {
    const { store, engine } = makeEngine(false, 4);
    const session = await store.createSession({
      topic: 'Scale a note-taking SaaS to 100k meetings per month',
      config: { agents: ['tech', 'finance'], debateRounds: 4, requireArbitration: false },
    });

    await engine.start(session.id);
    await waitForStatus(engine, session.id, 'complete');

    const snapshot = await engine.snapshot(session.id);
    expect(snapshot?.blackboard.positions).toHaveLength(8); // 2 agents × 4 rounds
    expect(new Set(snapshot?.blackboard.positions.map((position) => position.round))).toEqual(
      new Set([1, 2, 3, 4])
    );
  });

  it('pauses after every round and stops early when the arbiter asks', async () => {
    const { store, engine } = makeEngine(true, 4);
    const session = await store.createSession({
      topic: 'Choose the transcription provider for an AI notes SaaS',
      config: { agents: ['tech', 'finance', 'risk', 'strategy'], debateRounds: 4, requireArbitration: true },
    });

    const run = engine.start(session.id);
    await waitForStatus(engine, session.id, 'arbitrating');
    expect((await engine.snapshot(session.id))?.blackboard.positions).toHaveLength(4); // round 1

    await engine.arbitrate(session.id, { proceed: true });
    await waitForStatus(engine, session.id, 'arbitrating'); // gate after round 2
    expect((await engine.snapshot(session.id))?.blackboard.positions).toHaveLength(8); // round 2

    await engine.arbitrate(session.id, { stop: true });
    await run;
    await waitForStatus(engine, session.id, 'complete');

    const snapshot = await engine.snapshot(session.id);
    // Stopped after round 2 of 4: verdict delivered from 2 rounds only.
    expect(snapshot?.blackboard.positions).toHaveLength(8);
    expect(snapshot?.blackboard.verdict).not.toBeNull();
  });
});
