import { describe, it, expect } from 'vitest';
import {
  MOLECULE_CATALOG,
  CATALOG_MOLECULE_IDS,
  MOLECULE_CATALOG_COUNT,
  getCatalogMolecule,
  getCatalogMoleculeByIndex,
  catalogSymbolsPresent,
} from './moleculeCatalog.js';
import { isDuplicateOnlyFormula } from './knownMolecules.js';

describe('moleculeCatalog', () => {
  it('has exactly 50 molecules in fixed order', () => {
    expect(MOLECULE_CATALOG_COUNT).toBe(50);
    expect(CATALOG_MOLECULE_IDS).toHaveLength(50);
    expect(CATALOG_MOLECULE_IDS[0]).toBe('chonp');
    expect(CATALOG_MOLECULE_IDS[49]).toBe('kcn');
  });

  it.each(CATALOG_MOLECULE_IDS)('catalog entry %s has wikiUrl and unique symbols', (id) => {
    const mol = getCatalogMolecule(id);
    expect(mol).toBeTruthy();
    expect(mol.id).toBe(id);
    expect(mol.label).toBeTruthy();
    expect(mol.name).toBeTruthy();
    expect(mol.symbols.length).toBeGreaterThan(0);
    expect(mol.cardHint).toBe(mol.symbols.join(' + '));
    expect(mol.wikiUrl).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//);
    expect(isDuplicateOnlyFormula(mol.symbols)).toBe(false);
  });

  it('maps 1-based index to molecule', () => {
    expect(getCatalogMoleculeByIndex(1)?.id).toBe('chonp');
    expect(getCatalogMoleculeByIndex(2)?.id).toBe('h2o');
    expect(getCatalogMoleculeByIndex(50)?.id).toBe('kcn');
    expect(getCatalogMoleculeByIndex(0)).toBeNull();
    expect(getCatalogMoleculeByIndex(51)).toBeNull();
  });

  it('detects when catalog symbols are present', () => {
    expect(catalogSymbolsPresent('h2o', [{ symbol: 'H' }], [{ symbol: 'O' }])).toBe(true);
    expect(catalogSymbolsPresent('chonp', [{ symbol: 'C' }, { symbol: 'H' }], [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }])).toBe(true);
    expect(catalogSymbolsPresent('co2', [{ symbol: 'C' }], [{ symbol: 'O' }])).toBe(true);
    expect(catalogSymbolsPresent('h2o', [{ symbol: 'H' }], [])).toBe(false);
  });

  it('does not include duplicate-only formulas', () => {
    for (const mol of Object.values(MOLECULE_CATALOG)) {
      expect(new Set(mol.symbols).size).toBe(mol.symbols.length);
    }
  });
});
