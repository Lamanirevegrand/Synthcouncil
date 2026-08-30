import type {
  Arbitration,
  BlackboardState,
  CouncilEvent,
  Finding,
  LogEntry,
  Position,
  Session,
  Verdict,
} from '@synthcouncil/schemas';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS } from '../env';
import { api, ApiClientError, type SessionSnapshot } from '../lib/api';
import { AGENT_META, AGENT_ORDER } from '../lib/agents';
import { PHASE_LABEL, PHASE_ORDER } from '../lib/phases';
import AgentBadge from './AgentBadge';
import PhaseBadge from './PhaseBadge';
import SourceList from './SourceList';

function appendToBlackboard(
  current: BlackboardState | undefined,
  updater: (board: BlackboardState) => BlackboardState
): BlackboardState {
  const base: BlackboardState = current ?? {
    sessionId: '',
    findings: [],
    positions: [],
    arbitrations: [],
    verdict: null,
    log: [],
    updatedAt: new Date().toISOString(),
  };
  return updater(base);
}

export default function CouncilBoard({ sessionId }: { sessionId?: string }) {
  const [resolvedId] = useState<string | null>(() => {
    if (sessionId) return sessionId;
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('id');
  });
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const applyEvent = useCallback((event: CouncilEvent) => {
    setSnapshot((current) => {
      if (!current) return current;
      switch (event.type) {
        case 'phase':
          return { ...current, session: { ...current.session, status: event.phase } };
        case 'finding':
          return {
            ...current,
            blackboard: appendToBlackboard(current.blackboard, (board) => ({
              ...board,
              findings: [...board.findings, event.finding],
            })),
          };
        case 'position':
          return {
            ...current,
            blackboard: appendToBlackboard(current.blackboard, (board) => ({
              ...board,
              positions: [...board.positions, event.position],
            })),
          };
        case 'arbitration':
          return {
            ...current,
            blackboard: appendToBlackboard(current.blackboard, (board) => ({
              ...board,
              arbitrations: [...board.arbitrations, event.arbitration],
            })),
          };
        case 'verdict':
          return {
            ...current,
            blackboard: appendToBlackboard(current.blackboard, (board) => ({
              ...board,
              verdict: event.verdict,
            })),
          };
        case 'log':
          return {
            ...current,
            blackboard: appendToBlackboard(current.blackboard, (board) => ({
              ...board,
              log: [...board.log, event.entry],
            })),
          };
        case 'error':
          setError(event.message);
          return current;
        default:
          return current;
      }
    });
  }, []);

  useEffect(() => {
    if (!resolvedId) return;
    let active = true;

    api
      .getSession(resolvedId)
      .then((snap) => {
        if (active) setSnapshot(snap);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : String(caught));
      });

    const source = new EventSource(API_ENDPOINTS.events(resolvedId));
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    const handlers: Array<[string, (raw: string) => void]> = [
      ['phase', (raw) => applyEvent(JSON.parse(raw))],
      ['finding', (raw) => applyEvent(JSON.parse(raw))],
      ['position', (raw) => applyEvent(JSON.parse(raw))],
      ['arbitration', (raw) => applyEvent(JSON.parse(raw))],
      ['arbitration_request', () => setConnected((was) => was)],
      ['log', (raw) => applyEvent(JSON.parse(raw))],
      ['verdict', (raw) => applyEvent(JSON.parse(raw))],
      ['error', (raw) => applyEvent(JSON.parse(raw))],
    ];
    for (const [name, handler] of handlers) {
      source.addEventListener(name, (event) => handler((event as MessageEvent).data));
    }

    return () => {
      active = false;
      source.close();
    };
  }, [resolvedId, applyEvent]);

  const handleStart = async () => {
    if (!resolvedId) return;
    setStarting(true);
    setError(null);
    try {
      await api.startSession(resolvedId);
      // The engine emits a phase event right away; refresh once for safety.
      const snap = await api.getSession(resolvedId);
      setSnapshot(snap);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : caught instanceof Error ? caught.message : String(caught));
    } finally {
      setStarting(false);
    }
  };

  const session = snapshot?.session;
  const blackboard = snapshot?.blackboard;

  if (!resolvedId) {
    return (
      <div className="card">
        <h3>🧭 No session selected</h3>
        <p className="muted">This chamber needs a session id in the URL (?id=…).</p>
        <a className="btn btn-ghost" href="/">
          ← Convene a new council
        </a>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="card">
        <h3>⚠️ Could not load the session</h3>
        <p>{error}</p>
        <a className="btn btn-ghost" href="/">
          ← Back to convening a council
        </a>
      </div>
    );
  }

  if (!session || !blackboard) {
    return <div className="loading">Loading the council chamber…</div>;
  }

  const phaseIndex = PHASE_ORDER.indexOf(session.status);

  return (
    <div className="board">
      <section className="card board-header">
        <div>
          <h2>{session.topic}</h2>
          {session.context && <p className="muted context-line">{session.context}</p>}
          <div className="meta-line">
            <PhaseBadge phase={session.status} />
            <span className={`pill ${connected ? 'pill-ok' : 'pill-off'}`}>
              {connected ? '● live' : '○ stream offline'}
            </span>
            <span className="muted">session {session.id.slice(0, 8)}</span>
          </div>
        </div>
        <div className="stepper">
          {PHASE_ORDER.map((phase, index) => (
            <div
              key={phase}
              className={`step${index === phaseIndex ? ' current' : ''}${index < phaseIndex ? ' done' : ''}`}
            >
              <span className="step-dot" />
              <span className="step-label">{PHASE_LABEL[phase]}</span>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      {session.status === 'created' && (
        <section className="card">
          <h3>⏱️ The council is convened but has not started.</h3>
          <p className="muted">
            Launching the investigation makes each expert search the live web for evidence. Progress
            streams into this page in real time.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleStart} disabled={starting}>
            {starting ? 'Convening…' : 'Start the investigation'}
          </button>
        </section>
      )}

      {session.status === 'error' && (
        <section className="card">
          <h3>❌ The council hit an error</h3>
          <p>{session.error ?? 'Unknown failure. Try convening a new session.'}</p>
          <a className="btn btn-ghost" href="/">
            ← New session
          </a>
        </section>
      )}

      {blackboard.findings.length > 0 && <FindingsSection findings={blackboard.findings} />}
      {blackboard.positions.length > 0 && <PositionsSection positions={blackboard.positions} />}
      {blackboard.arbitrations.length > 0 && <ArbitrationsSection arbitrations={blackboard.arbitrations} />}

      {session.status === 'arbitrating' && (
        <ArbitrationPanel sessionId={resolvedId} />
      )}

      {blackboard.verdict && <VerdictSection verdict={blackboard.verdict} />}

      <LogSection log={blackboard.log} />
    </div>
  );
}

function FindingsSection({ findings }: { findings: Finding[] }) {
  const byAgent = useMemo(() => {
    const groups = new Map<string, Finding[]>();
    for (const finding of findings) {
      const list = groups.get(finding.agentId) ?? [];
      list.push(finding);
      groups.set(finding.agentId, list);
    }
    return [...groups.entries()];
  }, [findings]);

  return (
    <section className="card">
      <h3>🔎 Investigation findings <span className="muted">({findings.length})</span></h3>
      <div className="finding-grid">
        {byAgent.map(([agentId, agentFindings]) => (
          <div className="finding-group" key={agentId}>
            <h4>
              <AgentBadge agentId={agentId as Finding['agentId']} />
            </h4>
            {agentFindings.map((finding) => (
              <article className="finding" key={finding.id}>
                <p className="finding-claim">{finding.claim}</p>
                <p className="muted finding-evidence">{finding.evidence}</p>
                <SourceList sources={finding.sources} compact />
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function PositionsSection({ positions }: { positions: Position[] }) {
  const rounds = useMemo(() => {
    const map = new Map<number, Position[]>();
    for (const position of positions) {
      const list = map.get(position.round) ?? [];
      list.push(position);
      map.set(position.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [positions]);

  return (
    <section className="card">
      <h3>💬 Debate positions <span className="muted">({positions.length})</span></h3>
      {rounds.map(([round, roundPositions]) => (
        <div key={round} className="round-block">
          <h4>Round {round}</h4>
          <div className="position-grid">
            {roundPositions.map((position) => (
              <article className="position" key={position.id}>
                <header>
                  <AgentBadge agentId={position.agentId} />
                  <span className={`stance stance-${position.stance}`}>{position.stance}</span>
                </header>
                <h5>{position.headline}</h5>
                <p>{position.argument}</p>
                {position.objections.length > 0 && (
                  <div className="objections">
                    <strong>Objections raised</strong>
                    <ul>
                      {position.objections.map((objection, index) => (
                        <li key={index}>
                          <AgentBadge agentId={objection.against} /> — {objection.point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {position.sources.length > 0 && <SourceList sources={position.sources} compact />}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ArbitrationsSection({ arbitrations }: { arbitrations: Arbitration[] }) {
  return (
    <section className="card">
      <h3>👤 Human directives <span className="muted">({arbitrations.length})</span></h3>
      <ul className="directive-list">
        {arbitrations.map((arbitration) => (
          <li key={arbitration.id}>
            <blockquote>“{arbitration.directive}”</blockquote>
            {arbitration.targetAgent && <AgentBadge agentId={arbitration.targetAgent} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArbitrationPanel({ sessionId }: { sessionId: string }) {
  const [directive, setDirective] = useState('');
  const [target, setTarget] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (payload: { directive?: string; targetAgent?: string; proceed?: boolean }) => {
    setBusy(true);
    setError(null);
    try {
      await api.arbitrate(sessionId, {
        directive: payload.directive,
        targetAgent: payload.targetAgent ? (payload.targetAgent as Session['config']['agents'][number]) : undefined,
        proceed: payload.proceed,
      });
      setDirective('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card arbitration-panel">
      <h3>🛑 Your arbitration is required</h3>
      <p className="muted">
        Round 1 is complete. As arbiter you can reorient the debate — for example:
        <em> “Tech, verify whether we can integrate direct payment to the venue organizer so we never touch the pot.”</em>
      </p>
      <label className="field">
        <span>Directive to the council</span>
        <textarea
          value={directive}
          onChange={(event) => setDirective(event.target.value)}
          placeholder="Your instruction reorients the blackboard; round 2 will run with it in context."
          rows={3}
        />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Aim at one agent (optional)</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="">All agents</option>
            {AGENT_ORDER.map((id) => (
              <option key={id} value={id}>
                {AGENT_META[id].emoji} {AGENT_META[id].label} — {AGENT_META[id].role}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || directive.trim().length === 0}
          onClick={() => send({ directive: directive.trim(), targetAgent: target || undefined })}
        >
          {busy ? 'Sending…' : 'Send directive'}
        </button>
      </div>
      <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => send({ proceed: true })}>
        Proceed without a directive
      </button>
      {error && <div className="alert">{error}</div>}
    </section>
  );
}

function VerdictSection({ verdict }: { verdict: Verdict }) {
  return (
    <section className="card verdict-card">
      <div className="card-head">
        <h3>🧑‍⚖️ Verdict of the council</h3>
        <span className="pill pill-ok">confidence {verdict.confidence}%</span>
      </div>
      <p className="verdict-summary">{verdict.summary}</p>

      {verdict.recommendations.length > 0 && (
        <>
          <h4>Recommendations</h4>
          <ul className="verdict-list">
            {verdict.recommendations.map((recommendation, index) => (
              <li key={index}>
                <AgentBadge agentId={recommendation.owner} />
                <strong>{recommendation.title}</strong> — {recommendation.detail}
              </li>
            ))}
          </ul>
        </>
      )}

      {verdict.risks.length > 0 && (
        <>
          <h4>Risks</h4>
          <ul className="verdict-list">
            {verdict.risks.map((risk, index) => (
              <li key={index} className={`risk risk-${risk.severity}`}>
                <strong>{risk.title}</strong> <span className="pill">{risk.severity}</span> — {risk.detail}
              </li>
            ))}
          </ul>
        </>
      )}

      {verdict.sources.length > 0 && (
        <>
          <h4>Sources consulted</h4>
          <SourceList sources={verdict.sources} />
        </>
      )}
    </section>
  );
}

function LogSection({ log }: { log: LogEntry[] }) {
  const visible = log.slice(-40).reverse();
  return (
    <section className="card">
      <h3>📜 Council log</h3>
      {visible.length === 0 ? (
        <p className="muted">The chamber is quiet…</p>
      ) : (
        <ul className="log-list">
          {visible.map((entry) => (
            <li key={entry.id} className={`log-${entry.kind}`}>
              <span className="log-time">{new Date(entry.at).toLocaleTimeString()}</span>
              {entry.agentId && <AgentBadge agentId={entry.agentId} />}
              <span>{entry.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
