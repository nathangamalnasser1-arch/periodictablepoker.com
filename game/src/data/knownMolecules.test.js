import { describe, it, expect } from 'vitest';
import {
  MOLECULES_WIKI_INDEX,
  KNOWN_MOLECULES,
  MOLECULE_CHECK_ORDER,
  INVALID_DUPLICATE_ONLY_FORMULAS,
  MASS_TIER,
  moleculeWikiUrl,
  isSymbolInKnownMolecule,
  getKnownMolecule,
  matchMoleculeCombo,
  validateMoleculeDefinition,
  isDuplicateOnlyFormula,
  moleculeCardsDescription,
  moleculeRankingLabel,
} from './knownMolecules.js';

describe('knownMolecules', () => {
  it('defines wiki URLs for NaCl, H₂O, CHONP, CO₂', () => {
    expect(moleculeWikiUrl('nacl')).toBe('https://en.wikipedia.org/wiki/Sodium_chloride');
    expect(moleculeWikiUrl('h2o')).toBe('https://en.wikipedia.org/wiki/Water');
    expect(moleculeWikiUrl('chonp')).toBe('https://en.wikipedia.org/wiki/DNA');
    expect(moleculeWikiUrl('co2')).toBe('https://en.wikipedia.org/wiki/Carbon_dioxide');
  });

  it('links to Wikipedia lists of molecules index', () => {
    expect(MOLECULES_WIKI_INDEX).toBe('https://en.wikipedia.org/wiki/Lists_of_molecules');
  });

  it('identifies symbols in each molecule', () => {
    expect(isSymbolInKnownMolecule('Na', 'nacl')).toBe(true);
    expect(isSymbolInKnownMolecule('Cl', 'nacl')).toBe(true);
    expect(isSymbolInKnownMolecule('H', 'h2o')).toBe(true);
    expect(isSymbolInKnownMolecule('C', 'chonp')).toBe(true);
    expect(isSymbolInKnownMolecule('C', 'co2')).toBe(true);
    expect(isSymbolInKnownMolecule('O', 'co2')).toBe(true);
    expect(isSymbolInKnownMolecule('Fe', 'nacl')).toBe(false);
  });

  it('returns null for unknown combo', () => {
    expect(getKnownMolecule('mass')).toBeNull();
    expect(moleculeWikiUrl(null)).toBeNull();
  });

  it('has four known molecules in tier order', () => {
    expect(Object.keys(KNOWN_MOLECULES)).toEqual(['chonp', 'h2o', 'nacl', 'co2']);
    expect(MOLECULE_CHECK_ORDER.map((m) => m.id)).toEqual(['chonp', 'h2o', 'nacl', 'co2']);
    expect(MOLECULE_CHECK_ORDER.map((m) => m.tier)).toEqual([1, 2, 3, 4]);
    expect(MASS_TIER).toBe(5);
  });

  it('describes card requirements with formula and symbols', () => {
    expect(moleculeCardsDescription('h2o')).toBe('H₂O (Water) — H + O');
    expect(moleculeCardsDescription('co2')).toBe('CO₂ (Carbon dioxide) — C + O');
    expect(moleculeCardsDescription('nacl')).toBe('NaCl (Sodium chloride) — Na + Cl');
  });

  it('builds ranking label for rules copy', () => {
    expect(moleculeRankingLabel()).toBe('CHONP → H₂O → NaCl → CO₂ → best mass');
  });

  it('validates each molecule uses unique symbols from the deck', () => {
    for (const mol of Object.values(KNOWN_MOLECULES)) {
      expect(() => validateMoleculeDefinition(mol)).not.toThrow();
    }
    expect(() => validateMoleculeDefinition({
      id: 'bad',
      symbols: ['O', 'O'],
    })).toThrow(/duplicate symbol/);
    expect(() => validateMoleculeDefinition({
      id: 'bad',
      symbols: ['Xx'],
    })).toThrow(/unknown symbol/);
  });

  it('flags duplicate-only formulas as not playable', () => {
    for (const f of INVALID_DUPLICATE_ONLY_FORMULAS) {
      expect(isDuplicateOnlyFormula(f.symbols)).toBe(true);
    }
    expect(isDuplicateOnlyFormula(['C', 'O'])).toBe(false);
  });

  describe('matchMoleculeCombo', () => {
    it('returns h2o when H and O present', () => {
      expect(matchMoleculeCombo([{ symbol: 'H' }], [{ symbol: 'O' }])).toBe('h2o');
    });
    it('returns nacl when Na and Cl present', () => {
      expect(matchMoleculeCombo([{ symbol: 'Na' }], [{ symbol: 'Cl' }])).toBe('nacl');
    });
    it('returns chonp when C, H, O, N, P all present', () => {
      expect(matchMoleculeCombo(
        [{ symbol: 'C' }, { symbol: 'H' }],
        [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }],
      )).toBe('chonp');
    });
    it('returns co2 when C and O present without H', () => {
      expect(matchMoleculeCombo([{ symbol: 'C' }], [{ symbol: 'O' }])).toBe('co2');
    });
    it('prefers h2o over co2 when H and O present', () => {
      expect(matchMoleculeCombo(
        [{ symbol: 'C' }, { symbol: 'H' }],
        [{ symbol: 'O' }],
      )).toBe('h2o');
    });
    it('does not match O₂-style duplicate-only formulas', () => {
      expect(matchMoleculeCombo([{ symbol: 'O' }], [])).toBe(null);
    });
    it('returns null when no combo', () => {
      expect(matchMoleculeCombo([{ symbol: 'Fe' }], [])).toBe(null);
    });
  });
});
