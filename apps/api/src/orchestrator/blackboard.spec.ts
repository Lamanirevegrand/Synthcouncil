import { describe, expect, it } from 'vitest';
import type { Finding, Position } from '@synthcouncil/schemas';
import {
  emptyBlackboard,
  withArbitration,
  withFinding,
  withLog,
  withPosition,
  withVerdict,
} from './blackboard.js';

const sessionId = '00000000-0000-4000-8000-000000000000';

const finding: Finding = {
  id: 'f1',
  agentId: 'tech',
  claim: 'Stateless webhooks are recommended',
  evidence: 'Official docs recommend idempotent webhook callbacks.',
  sources: [{ url: 'https://docs.example.com/webhooks', title: 'Webhooks' }],
  createdAt: new Date().toISOString(),
};

const position: Position = {
  id: 'p1',
  agentId: 'finance',
  round: 1,
  stance: 'concerns',
  headline: 'Fee model unclear',
  argument: 'The per-transaction cost curve breaks at micro-volume.',
  objections: [{ against: 'tech', point: 'Latency claims lack benchmarks.' }],
  supportingFindingIds: [],
  sources: [],
  createdAt: new Date().toISOString(),
};

describe('blackboard reducers', () => {
  it('creates an empty, valid blackboard', () => {
    const board = emptyBlackboard(sessionId);
    expect(board.sessionId).toBe(sessionId);
    expect(board.findings).toEqual([]);
    expect(board.positions).toEqual([]);
    expect(board.arbitrations).toEqual([]);
    expect(board.verdict).toBeNull();
  });

  it('appends findings immutably', () => {
    const board = withFinding(emptyBlackboard(sessionId), finding);
    expect(board.findings).toHaveLength(1);
    expect(emptyBlackboard(sessionId).findings).toHaveLength(0);
  });

  it('keeps a chronological position log', () => {
    const board = withPosition(emptyBlackboard(sessionId), position);
    expect(board.positions[0].agentId).toBe('finance');
    expect(board.positions[0].round).toBe(1);
  });

  it('stores arbitrations and the verdict', () => {
    let board = withArbitration(emptyBlackboard(sessionId), {
      id: 'a1',
      directive: 'Verify direct payment to the organizer',
      createdAt: new Date().toISOString(),
    });
    board = withVerdict(board, {
      summary: 'Proceed in phases.',
      recommendations: [{ title: 'MVP', detail: 'Build the stateless core first', owner: 'tech' }],
      risks: [{ title: 'ToS change', detail: 'Payment provider may change terms', severity: 'high' }],
      sources: [],
      confidence: 70,
    });
    expect(board.arbitrations[0].directive).toContain('direct payment');
    expect(board.verdict?.recommendations[0].owner).toBe('tech');
  });

  it('appends log entries in order', () => {
    const now = new Date().toISOString();
    const board = withLog(emptyBlackboard(sessionId), {
      id: 'l1',
      at: now,
      kind: 'phase',
      message: 'Phase → investigating',
    });
    expect(board.log).toHaveLength(1);
    expect(board.log[0].kind).toBe('phase');
  });
});
