import type {
  Arbitration,
  ArbitrateInput,
  BlackboardState,
  CouncilEvent,
  Finding,
  LogKind,
  Position,
  Session,
  Verdict,
} from '@synthcouncil/schemas';
import { VerdictOutputSchema } from '@synthcouncil/schemas';
import { getAgents } from '../agents/registry.js';
import { runDebatePosition, runInvestigation } from '../agents/runner.js';
import type { EvidenceProvider } from '../evidence/types.js';
import type { LlmClient } from '../llm/client.js';
import { normalizeSource } from '../llm/json.js';
import type { CouncilStore } from '../storage/types.js';
import { ApiError } from '../utils/errors.js';
import { createId, nowIso } from '../utils/ids.js';
import {
  emptyBlackboard,
  withArbitration,
  withFinding,
  withLog,
  withPosition,
  withVerdict,
} from './blackboard.js';
import { publish } from './bus.js';
import { buildSynthesisSystem, buildSynthesisUser } from './synthesis.js';

export interface EngineDeps {
  store: CouncilStore;
  llm: LlmClient;
  evidence: EvidenceProvider;
}

export interface SessionSnapshot {
  session: Session;
  blackboard: BlackboardState;
}

/**
 * The orchestration engine. It reads the shared blackboard, distributes the
 * floor to each agent in DAG order, pauses for the human arbiter, and finally
 * produces a Zod-validated verdict.
 *
 *   created → investigating → (debating ⇄ arbitrating)* → synthesizing → complete
 *
 * A session runs 1 to 4 debate rounds (`config.debateRounds`). When
 * `requireArbitration` is on, the engine pauses after every round except the
 * last: the arbiter may inject a directive, continue silently, or stop early —
 * the verdict is then synthesized from whatever rounds were completed.
 *
 * Agents never talk to each other directly — every exchange goes through the
 * blackboard, which keeps the state machine stable and replayable.
 */
export class CouncilEngine {
  private readonly running = new Set<string>();

  constructor(private readonly deps: EngineDeps) { }

  async snapshot(sessionId: string): Promise<SessionSnapshot | null> {
    const [session, blackboard] = await Promise.all([
      this.deps.store.getSession(sessionId),
      this.deps.store.getBlackboard(sessionId),
    ]);
    if (!session) return null;
    return { session, blackboard: blackboard ?? emptyBlackboard(sessionId) };
  }

  /** Kick off the DAG. Responds immediately; the engine runs in the background. */
  async start(sessionId: string): Promise<void> {
    if (this.running.has(sessionId)) {
      throw new ApiError(409, 'Session is already running.');
    }

    this.running.add(sessionId);
    try {
      const session = await this.requireSession(sessionId);
      if (session.status !== 'created') {
        throw new ApiError(409, `Session is already in state "${session.status}".`);
      }

      await this.setPhase(sessionId, 'investigating');
      const agents = getAgents(session.config.agents);

      for (const agent of agents) {
        await this.log(sessionId, 'agent', `🔎 ${agent.roleLabel} is investigating…`, agent.id);
        const { findings, queries, evidenceCount } = await runInvestigation(
          agent,
          this.deps.llm,
          this.deps.evidence,
          session.topic,
          session.context
        );
        for (const finding of findings) {
          await this.appendFinding(sessionId, finding);
        }
        await this.log(
          sessionId,
          'agent',
          `📋 ${agent.label} published ${findings.length} finding(s) from ${queries.length} query(ies), ${evidenceCount} source(s).`,
          agent.id
        );
      }

      await this.setPhase(sessionId, 'debating');
      await this.runDebateRound(sessionId, 1, session.config.agents);
      await this.advanceAfterRound(sessionId, 1);
    } catch (error) {
      if (error instanceof ApiError) {
        // Domain errors (e.g. 409 double-start) bubble up to the caller
        // instead of failing the session.
        throw error;
      }
      await this.fail(sessionId, error);
    } finally {
      this.running.delete(sessionId);
    }
  }

  /** Resume from the arbitration gate: inject a directive, proceed, or stop early. */
  async arbitrate(sessionId: string, input: ArbitrateInput): Promise<void> {
    const session = await this.requireSession(sessionId);
    if (session.status !== 'arbitrating') {
      throw new ApiError(409, `Cannot arbitrate a session in state "${session.status}".`);
    }

    if (input.directive) {
      const arbitration: Arbitration = {
        id: createId('arb'),
        directive: input.directive,
        targetAgent: input.targetAgent,
        createdAt: nowIso(),
      };
      await this.appendArbitration(sessionId, arbitration);
      await this.log(sessionId, 'human', `👤 Directive: ${input.directive}`, input.targetAgent);
    } else if (input.stop) {
      await this.log(sessionId, 'human', '👤 The arbiter ended the debate early — the council delivers its verdict now.');
    } else {
      await this.log(sessionId, 'human', '👤 The arbiter proceeded without a directive.');
    }

    if (input.stop) {
      await this.synthesize(sessionId);
      return;
    }

    const board = await this.deps.store.getBlackboard(sessionId);
    const roundsCompleted = new Set(board?.positions.map((position) => position.round) ?? []).size;
    const nextRound = roundsCompleted + 1;

    await this.setPhase(sessionId, 'debating');
    await this.runDebateRound(sessionId, nextRound, session.config.agents);
    await this.advanceAfterRound(sessionId, nextRound);
  }

  /**
   * Decide what happens after a debate round completes: run the next round
   * automatically, pause for the arbiter, or synthesize the verdict when the
   * configured round count is reached (or exceeded, in case of an early stop).
   */
  private async advanceAfterRound(sessionId: string, completedRound: number): Promise<void> {
    const session = await this.requireSession(sessionId);
    const total = session.config.debateRounds;

    if (completedRound >= total) {
      await this.synthesize(sessionId);
      return;
    }

    if (session.config.requireArbitration) {
      await this.setPhase(sessionId, 'arbitrating');
      this.emit(sessionId, {
        type: 'arbitration_request',
        round: completedRound,
        totalRounds: total,
        message: `Round ${completedRound} of ${total} complete — the council awaits the human arbiter.`,
      });
      await this.log(
        sessionId,
        'human',
        `🛑 Debate paused after round ${completedRound}/${total} — awaiting human arbitration.`
      );
      return;
    }

    await this.setPhase(sessionId, 'debating');
    await this.runDebateRound(sessionId, completedRound + 1, session.config.agents);
    await this.advanceAfterRound(sessionId, completedRound + 1);
  }

  // -------------------------------------------------------------------------
  // DAG steps
  // -------------------------------------------------------------------------

  private async runDebateRound(sessionId: string, round: number, agentIds: Session['config']['agents']): Promise<void> {
    const { session, blackboard } = await this.requirePair(sessionId);
    const agents = getAgents(agentIds);

    for (const agent of agents) {
      await this.log(sessionId, 'agent', `💬 ${agent.roleLabel} is debating (round ${round})…`, agent.id);
      const position = await runDebatePosition(agent, this.deps.llm, {
        topic: session.topic,
        context: session.context,
        round,
        arbitrations: blackboard.arbitrations,
        ownFindings: blackboard.findings.filter((finding) => finding.agentId === agent.id),
        otherPositions: blackboard.positions.filter((position) => position.agentId !== agent.id),
      });
      await this.appendPosition(sessionId, position);
    }
  }

  private async synthesize(sessionId: string): Promise<void> {
    await this.setPhase(sessionId, 'synthesizing');
    await this.log(sessionId, 'system', '🧑‍⚖️ The council is writing its verdict…');

    const { session, blackboard } = await this.requirePair(sessionId);
    const chair = getAgents(['strategy'])[0];

    const output = await this.deps.llm.completeJson({
      system: buildSynthesisSystem(chair),
      user: buildSynthesisUser(session, blackboard),
      schema: VerdictOutputSchema,
      temperature: 0.4,
    });

    const verdict: Verdict = {
      summary: output.summary,
      recommendations: output.recommendations,
      risks: output.risks,
      sources: output.sources
        .map((source) => normalizeSource(source))
        .filter((source): source is { url: string; title: string; snippet?: string } => source !== null)
        .map((source) => ({ url: source.url, title: source.title, ...(source.snippet ? { snippet: source.snippet } : {}) })),
      confidence: output.confidence,
    };

    await this.appendVerdict(sessionId, verdict);
    await this.setPhase(sessionId, 'complete');
    await this.log(sessionId, 'system', '✅ Verdict delivered.');
  }

  // -------------------------------------------------------------------------
  // Persistence + events
  // -------------------------------------------------------------------------

  private emit(sessionId: string, event: CouncilEvent): void {
    publish(sessionId, event);
  }

  private async setPhase(sessionId: string, status: Session['status']): Promise<void> {
    const session = await this.deps.store.updateSession(sessionId, { status });
    this.emit(sessionId, { type: 'phase', phase: status });
    if (status !== 'error') {
      await this.log(sessionId, 'phase', `Phase → ${status}`, undefined, false);
    }
    void session;
  }

  private async appendFinding(sessionId: string, finding: Finding): Promise<void> {
    const board = await this.deps.store.getBlackboard(sessionId);
    const next = withFinding(board ?? emptyBlackboard(sessionId), finding);
    await this.deps.store.saveBlackboard(sessionId, next);
    this.emit(sessionId, { type: 'finding', finding });
  }

  private async appendPosition(sessionId: string, position: Position): Promise<void> {
    const board = await this.deps.store.getBlackboard(sessionId);
    const next = withPosition(board ?? emptyBlackboard(sessionId), position);
    await this.deps.store.saveBlackboard(sessionId, next);
    this.emit(sessionId, { type: 'position', position });
  }

  private async appendArbitration(sessionId: string, arbitration: Arbitration): Promise<void> {
    const board = await this.deps.store.getBlackboard(sessionId);
    const next = withArbitration(board ?? emptyBlackboard(sessionId), arbitration);
    await this.deps.store.saveBlackboard(sessionId, next);
    this.emit(sessionId, { type: 'arbitration', arbitration });
  }

  private async appendVerdict(sessionId: string, verdict: Verdict): Promise<void> {
    const board = await this.deps.store.getBlackboard(sessionId);
    const next = withVerdict(board ?? emptyBlackboard(sessionId), verdict);
    await this.deps.store.saveBlackboard(sessionId, next);
    this.emit(sessionId, { type: 'verdict', verdict });
  }

  private async log(
    sessionId: string,
    kind: LogKind,
    message: string,
    agentId?: Session['config']['agents'][number],
    emitLogEvent = true
  ): Promise<void> {
    const board = await this.deps.store.getBlackboard(sessionId);
    const entry = {
      id: createId('log'),
      at: nowIso(),
      kind,
      message,
      ...(agentId ? { agentId } : {}),
    };
    const next = withLog(board ?? emptyBlackboard(sessionId), entry);
    await this.deps.store.saveBlackboard(sessionId, next);
    if (emitLogEvent) {
      this.emit(sessionId, { type: 'log', entry });
    }
  }

  private async fail(sessionId: string, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[engine] session ${sessionId} failed:`, error);
    try {
      await this.deps.store.updateSession(sessionId, { status: 'error', error: message });
      // Let live clients flip to the error state immediately.
      this.emit(sessionId, { type: 'phase', phase: 'error' });
      await this.log(sessionId, 'error', `❌ Session failed: ${message}`);
      this.emit(sessionId, { type: 'error', message });
    } catch (persistError) {
      console.error(`[engine] failed to persist error state for ${sessionId}:`, persistError);
    }
  }

  private async requireSession(sessionId: string): Promise<Session> {
    const session = await this.deps.store.getSession(sessionId);
    if (!session) throw new ApiError(404, 'Session not found.');
    return session;
  }

  private async requirePair(sessionId: string): Promise<SessionSnapshot> {
    const snapshot = await this.snapshot(sessionId);
    if (!snapshot) throw new ApiError(404, 'Session not found.');
    return snapshot;
  }
}
