import { describe, it, expect } from 'vitest';
import {
  sortChampions,
  sortBestHands,
  sortCoins,
  sortOverall,
  rankEntries,
  formatBestHandLabel,
} from './rankings.js';

describe('rankings', () => {
  const entries = [
    { id: 'a', uid: 'a', displayName: 'A', gamesWon: 1, bestHandWeight: 50, coinBalance: 20 },
    { id: 'b', uid: 'b', displayName: 'B', gamesWon: 3, bestHandWeight: 120, coinBalance: 10 },
    { id: 'c', uid: 'c', displayName: 'C', gamesWon: 2, bestHandWeight: 80, coinBalance: 100 },
  ];

  describe('sortChampions', () => {
    it('sorts by games won', () => {
      expect(sortChampions(entries).map((e) => e.id)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('sortBestHands', () => {
    it('sorts by best hand weight', () => {
      expect(sortBestHands(entries).map((e) => e.id)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('sortCoins', () => {
    it('sorts by coin balance', () => {
      expect(sortCoins(entries).map((e) => e.id)).toEqual(['c', 'a', 'b']);
    });
  });

  describe('sortOverall', () => {
    it('sorts by composite score', () => {
      const sorted = sortOverall(entries);
      expect(sorted[0].composite).toBeGreaterThanOrEqual(sorted[1].composite);
    });
  });

  describe('rankEntries', () => {
    it('assigns ranks for tab', () => {
      const ranked = rankEntries(entries, 'champions');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].gamesWon).toBe(3);
    });
  });

  describe('formatBestHandLabel', () => {
    it('shows molecule and weight', () => {
      const label = formatBestHandLabel(100, 'chonp', (r) => (r === 'chonp' ? 'CHONP' : ''));
      expect(label).toContain('CHONP');
      expect(label).toContain('100 u');
    });
  });
});
