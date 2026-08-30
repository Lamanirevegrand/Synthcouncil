import type {
  Arbitration,
  BlackboardState,
  Finding,
  LogEntry,
  Position,
  Verdict,
} from '@synthcouncil/schemas';
import { nowIso } from '../utils/ids.js';

/**
 * Pure, immutable blackboard transitions. The engine only mutates the shared
 * state through these helpers, which guarantees every persisted snapshot is
 * Zod-valid and every SSE event is emitted after persistence.
 */
export function emptyBlackboard(sessionId: string): BlackboardState {
  return {
    sessionId,
    findings: [],
    positions: [],
    arbitrations: [],
    verdict: null,
    log: [],
    updatedAt: nowIso(),
  };
}

export function touch(board: BlackboardState): BlackboardState {
  return { ...board, updatedAt: nowIso() };
}

export function withFinding(board: BlackboardState, finding: Finding): BlackboardState {
  return touch({ ...board, findings: [...board.findings, finding] });
}

export function withPosition(board: BlackboardState, position: Position): BlackboardState {
  return touch({ ...board, positions: [...board.positions, position] });
}

export function withArbitration(board: BlackboardState, arbitration: Arbitration): BlackboardState {
  return touch({ ...board, arbitrations: [...board.arbitrations, arbitration] });
}

export function withVerdict(board: BlackboardState, verdict: Verdict): BlackboardState {
  return touch({ ...board, verdict });
}

export function withLog(board: BlackboardState, entry: LogEntry): BlackboardState {
  return touch({ ...board, log: [...board.log, entry] });
}

export function latestLog(board: BlackboardState, count = 50): LogEntry[] {
  return board.log.slice(-count);
}
