import { describe, it, expect } from 'vitest';
import {
  COINS_HAND_WIN,
  COINS_SESSION_WIN,
  shouldAwardHandWin,
  shouldAwardSessionWin,
  computeCoinAward,
  sortCoinEntriesByBalanceDesc,
  rankCoinEntries,
  formatCoinDate,
} from './coins.js';

describe('coins', () => {
  describe('shouldAwardHandWin', () => {
    const base = {
      isSubscriber: true,
      gameNumber: 4,
      humanIndex: 0,
      winnerIndex: 0,
      winnerIndices: null,
      isShowdown: true,
      isMultiplayer: false,
    };

    it('awards solo hand wins for subscribers at game 4+', () => {
      expect(shouldAwardHandWin(base)).toBe(true);
    });

    it('does not award guests', () => {
      expect(shouldAwardHandWin({ ...base, isSubscriber: false })).toBe(false);
    });

    it('does not award multiplayer hand wins', () => {
      expect(shouldAwardHandWin({ ...base, isMultiplayer: true })).toBe(false);
    });

    it('does not award tutorial hands', () => {
      expect(shouldAwardHandWin({ ...base, gameNumber: 3 })).toBe(false);
    });

    it('does not award when human lost', () => {
      expect(shouldAwardHandWin({ ...base, winnerIndex: 1 })).toBe(false);
    });
  });

  describe('shouldAwardSessionWin', () => {
    const base = {
      isSubscriber: true,
      gameNumber: 4,
      isGameOver: true,
      sessionWinnerIndex: 0,
      humanIndex: 0,
    };

    it('awards session winner for subscribers', () => {
      expect(shouldAwardSessionWin(base)).toBe(true);
    });

    it('works for multiplayer session wins', () => {
      expect(shouldAwardSessionWin(base)).toBe(true);
    });

    it('does not award when not game over', () => {
      expect(shouldAwardSessionWin({ ...base, isGameOver: false })).toBe(false);
    });

    it('does not award when human did not win session', () => {
      expect(shouldAwardSessionWin({ ...base, sessionWinnerIndex: 2 })).toBe(false);
    });
  });

  describe('computeCoinAward', () => {
    it('sums hand and session awards', () => {
      const { total, parts } = computeCoinAward({ handWin: true, sessionWin: true });
      expect(total).toBe(COINS_HAND_WIN + COINS_SESSION_WIN);
      expect(parts).toHaveLength(2);
    });

    it('returns zero when no wins', () => {
      expect(computeCoinAward({ handWin: false, sessionWin: false }).total).toBe(0);
    });
  });

  describe('sortCoinEntriesByBalanceDesc', () => {
    it('sorts by coin balance descending', () => {
      const sorted = sortCoinEntriesByBalanceDesc([
        { displayName: 'A', coinBalance: 10 },
        { displayName: 'B', coinBalance: 50 },
        { displayName: 'C', coinBalance: 30 },
      ]);
      expect(sorted.map((r) => r.displayName)).toEqual(['B', 'C', 'A']);
    });
  });

  describe('rankCoinEntries', () => {
    it('assigns ranks after sort', () => {
      const ranked = rankCoinEntries([
        { id: 'a', coinBalance: 5 },
        { id: 'b', coinBalance: 20 },
      ]);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].id).toBe('b');
      expect(ranked[1].rank).toBe(2);
    });
  });

  describe('formatCoinDate', () => {
    it('returns dash for missing date', () => {
      expect(formatCoinDate(null)).toBe('—');
    });
  });
});
