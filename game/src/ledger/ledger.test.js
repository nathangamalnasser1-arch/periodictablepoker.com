import { describe, it, expect } from 'vitest';
import {
  buildLedgerEvents,
  formatLedgerEventType,
  formatLedgerHandPot,
  filterLedgerByPlayerName,
  filterLedgerByEventType,
} from './ledger.js';

describe('ledger', () => {
  describe('buildLedgerEvents', () => {
    it('creates session stat_update', () => {
      const events = buildLedgerEvents({
        sessionStart: true,
        gameNumber: 4,
        isMultiplayer: false,
        uid: 'u1',
        displayName: 'Alice',
      });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('stat_update');
    });

    it('creates hand_win and session_win events', () => {
      const events = buildLedgerEvents({
        statPayload: {
          handWin: true,
          sessionWin: true,
          potWon: 100,
          handWeight: 200,
          winnerReason: 'chonp',
          deltas: { handsWon: 1 },
        },
        coinParts: [
          { amount: 10, reason: 'hand_win' },
          { amount: 100, reason: 'session_win' },
        ],
        coinTotal: 110,
        gameNumber: 5,
        isMultiplayer: false,
        uid: 'u1',
        displayName: 'Bob',
      });
      expect(events.some((e) => e.eventType === 'hand_win')).toBe(true);
      expect(events.some((e) => e.eventType === 'session_win')).toBe(true);
    });
  });

  describe('formatLedgerEventType', () => {
    it('formats known types', () => {
      expect(formatLedgerEventType('hand_win')).toBe('Hand win');
      expect(formatLedgerEventType('session_win')).toBe('Session win');
    });
  });

  describe('formatLedgerHandPot', () => {
    it('combines weight and pot', () => {
      expect(formatLedgerHandPot({ handWeight: 50, potWon: 120 })).toContain('50 u');
      expect(formatLedgerHandPot({ handWeight: 50, potWon: 120 })).toContain('120 pot');
    });
  });

  describe('filterLedgerByPlayerName', () => {
    const rows = [
      { displayName: 'Alice' },
      { displayName: 'Bob' },
    ];

    it('filters by substring', () => {
      expect(filterLedgerByPlayerName(rows, 'ali')).toHaveLength(1);
    });

    it('returns all when search empty', () => {
      expect(filterLedgerByPlayerName(rows, '')).toHaveLength(2);
    });
  });

  describe('filterLedgerByEventType', () => {
    const rows = [
      { eventType: 'hand_win' },
      { eventType: 'session_win' },
    ];

    it('filters by type', () => {
      expect(filterLedgerByEventType(rows, 'hand_win')).toHaveLength(1);
    });

    it('returns all for all filter', () => {
      expect(filterLedgerByEventType(rows, 'all')).toHaveLength(2);
    });
  });
});
