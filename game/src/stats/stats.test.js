import { describe, it, expect } from 'vitest';
import {
  shouldTrackStats,
  humanPlayedHand,
  humanWonHand,
  computeStatDeltas,
  mergeStats,
  compositeScore,
} from './stats.js';

describe('stats', () => {
  describe('shouldTrackStats', () => {
    it('requires subscriber and game 4+', () => {
      expect(shouldTrackStats({ isSubscriber: true, gameNumber: 4 })).toBe(true);
      expect(shouldTrackStats({ isSubscriber: false, gameNumber: 4 })).toBe(false);
      expect(shouldTrackStats({ isSubscriber: true, gameNumber: 3 })).toBe(false);
    });
  });

  describe('humanPlayedHand', () => {
    it('false when folded', () => {
      expect(humanPlayedHand({ players: [{ folded: true }] }, 0)).toBe(false);
      expect(humanPlayedHand({ players: [{ folded: false }] }, 0)).toBe(true);
    });
  });

  describe('humanWonHand', () => {
    it('checks winner indices', () => {
      expect(humanWonHand({ winnerIndex: 0, winnerIndices: [0] }, 0)).toBe(true);
      expect(humanWonHand({ winnerIndex: 1 }, 0)).toBe(false);
    });
  });

  describe('computeStatDeltas', () => {
    it('increments gamesPlayed on session start', () => {
      const result = computeStatDeltas({
        sessionStart: true,
        gameNumber: 4,
        humanIndex: 0,
      });
      expect(result.deltas.gamesPlayed).toBe(1);
    });

    it('counts hand played at showdown', () => {
      const result = computeStatDeltas({
        gameState: {
          phase: 'showdown',
          players: [{ folded: false, holeCards: [], chips: 1000 }],
          communityCards: [],
          winnerIndex: 0,
          winnerIndices: [0],
          winnerReason: 'mass',
          totalBetThisHand: [0, 0],
        },
        gameNumber: 4,
        isGameOver: false,
        humanIndex: 0,
        sessionStart: false,
      });
      expect(result.deltas.handsPlayed).toBe(1);
      expect(result.deltas.handsWon).toBe(1);
      expect(result.handWin).toBe(true);
    });
  });

  describe('mergeStats', () => {
    it('accumulates counters and max fields', () => {
      const next = mergeStats(
        { gamesPlayed: 1, gamesWon: 0, handsPlayed: 2, handsWon: 1, bestHandWeight: 50, highestPotWin: 20 },
        { handsPlayed: 1, handsWon: 1, gamesWon: 1 },
        120,
        'chonp',
        80,
      );
      expect(next.handsPlayed).toBe(3);
      expect(next.handsWon).toBe(2);
      expect(next.gamesWon).toBe(1);
      expect(next.bestHandWeight).toBe(120);
      expect(next.bestHandReason).toBe('chonp');
      expect(next.highestPotWin).toBe(80);
    });
  });

  describe('compositeScore', () => {
    it('weights games won, coins, and hand weight', () => {
      expect(compositeScore({ gamesWon: 2, coinBalance: 50, bestHandWeight: 95 })).toBe(
        2 * 100 + 50 + 9,
      );
    });
  });
});
