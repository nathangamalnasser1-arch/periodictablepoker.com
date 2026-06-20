import { describe, it, expect } from 'vitest';
import {
  isMoleculeWin,
  moleculeLabel,
  validateDisplayName,
  shouldShowMoleculeScoreboard,
  sortScoresByDateDesc,
  groupScoresByMolecule,
  formatScoreDate,
  timestampToMs,
} from './scoreboard.js';

describe('scoreboard', () => {
  describe('isMoleculeWin', () => {
    it('accepts nacl, h2o, chonp', () => {
      expect(isMoleculeWin('nacl')).toBe(true);
      expect(isMoleculeWin('h2o')).toBe(true);
      expect(isMoleculeWin('chonp')).toBe(true);
    });

    it('rejects mass and other reasons', () => {
      expect(isMoleculeWin('mass')).toBe(false);
      expect(isMoleculeWin(null)).toBe(false);
      expect(isMoleculeWin('')).toBe(false);
    });
  });

  describe('moleculeLabel', () => {
    it('maps reason codes to display labels', () => {
      expect(moleculeLabel('nacl')).toBe('NaCl');
      expect(moleculeLabel('h2o')).toBe('H₂O');
      expect(moleculeLabel('chonp')).toBe('CHONP');
      expect(moleculeLabel('mass')).toBe('');
    });
  });

  describe('validateDisplayName', () => {
    it('rejects empty names', () => {
      expect(validateDisplayName('').ok).toBe(false);
      expect(validateDisplayName('   ').ok).toBe(false);
    });

    it('accepts trimmed names up to 32 chars', () => {
      const r = validateDisplayName('  Alice  ');
      expect(r.ok).toBe(true);
      expect(r.value).toBe('Alice');
    });

    it('rejects names over 32 chars', () => {
      expect(validateDisplayName('a'.repeat(33)).ok).toBe(false);
    });
  });

  describe('shouldShowMoleculeScoreboard', () => {
    const base = {
      isShowdown: true,
      humanIndex: 0,
      winnerIndex: 0,
      winnerIndices: null,
      winnerReason: 'chonp',
      gameNumber: 4,
      isMultiplayer: false,
    };

    it('shows when human wins with molecule in real game', () => {
      expect(shouldShowMoleculeScoreboard(base)).toBe(true);
    });

    it('does not show for mass wins', () => {
      expect(shouldShowMoleculeScoreboard({ ...base, winnerReason: 'mass' })).toBe(false);
    });

    it('does not show when human lost', () => {
      expect(shouldShowMoleculeScoreboard({ ...base, winnerIndex: 1 })).toBe(false);
    });

    it('does not show in tutorial (gameNumber < 4)', () => {
      expect(shouldShowMoleculeScoreboard({ ...base, gameNumber: 3 })).toBe(false);
    });

    it('does not show in multiplayer', () => {
      expect(shouldShowMoleculeScoreboard({ ...base, isMultiplayer: true })).toBe(false);
    });

    it('does not show when not showdown', () => {
      expect(shouldShowMoleculeScoreboard({ ...base, isShowdown: false })).toBe(false);
    });
  });

  describe('sortScoresByDateDesc', () => {
    it('sorts by submittedAtMs descending', () => {
      const sorted = sortScoresByDateDesc([
        { displayName: 'A', submittedAtMs: 100 },
        { displayName: 'B', submittedAtMs: 300 },
        { displayName: 'C', submittedAtMs: 200 },
      ]);
      expect(sorted.map(s => s.displayName)).toEqual(['B', 'C', 'A']);
    });
  });

  describe('groupScoresByMolecule', () => {
    it('groups scores into molecule tabs', () => {
      const groups = groupScoresByMolecule([
        { molecule: 'nacl', submittedAtMs: 1 },
        { molecule: 'chonp', submittedAtMs: 2 },
        { molecule: 'h2o', submittedAtMs: 3 },
        { molecule: 'chonp', submittedAtMs: 4 },
      ]);
      expect(groups.chonp).toHaveLength(2);
      expect(groups.h2o).toHaveLength(1);
      expect(groups.nacl).toHaveLength(1);
      expect(groups.chonp[0].submittedAtMs).toBe(4);
    });
  });

  describe('formatScoreDate', () => {
    it('formats Firestore-like timestamps', () => {
      const str = formatScoreDate({ seconds: 1700000000 });
      expect(str).not.toBe('—');
    });

    it('returns dash for missing timestamp', () => {
      expect(formatScoreDate(null)).toBe('—');
    });
  });

  describe('timestampToMs', () => {
    it('reads toMillis when available', () => {
      expect(timestampToMs({ toMillis: () => 5000 })).toBe(5000);
    });
  });
});
