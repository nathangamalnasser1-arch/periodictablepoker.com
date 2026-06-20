import { describe, it, expect } from 'vitest';
import {
  MOLECULES_WIKI_INDEX,
  KNOWN_MOLECULES,
  moleculeWikiUrl,
  isSymbolInKnownMolecule,
  getKnownMolecule,
} from './knownMolecules.js';

describe('knownMolecules', () => {
  it('defines wiki URLs for NaCl, H₂O, CHONP', () => {
    expect(moleculeWikiUrl('nacl')).toBe('https://en.wikipedia.org/wiki/Sodium_chloride');
    expect(moleculeWikiUrl('h2o')).toBe('https://en.wikipedia.org/wiki/Water');
    expect(moleculeWikiUrl('chonp')).toBe('https://en.wikipedia.org/wiki/DNA');
  });

  it('links to Wikipedia lists of molecules index', () => {
    expect(MOLECULES_WIKI_INDEX).toBe('https://en.wikipedia.org/wiki/Lists_of_molecules');
  });

  it('identifies symbols in each molecule', () => {
    expect(isSymbolInKnownMolecule('Na', 'nacl')).toBe(true);
    expect(isSymbolInKnownMolecule('Cl', 'nacl')).toBe(true);
    expect(isSymbolInKnownMolecule('H', 'h2o')).toBe(true);
    expect(isSymbolInKnownMolecule('C', 'chonp')).toBe(true);
    expect(isSymbolInKnownMolecule('Fe', 'nacl')).toBe(false);
  });

  it('returns null for unknown combo', () => {
    expect(getKnownMolecule('mass')).toBeNull();
    expect(moleculeWikiUrl(null)).toBeNull();
  });

  it('has three known molecules', () => {
    expect(Object.keys(KNOWN_MOLECULES)).toEqual(['chonp', 'h2o', 'nacl']);
  });
});
