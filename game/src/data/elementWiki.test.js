import { describe, it, expect } from 'vitest';
import { elementWikiUrl, resolveElementName, elementWikiUrlFromElement } from './elementWiki.js';

describe('elementWiki', () => {
  describe('elementWikiUrl', () => {
    it('builds Wikipedia URL from element name like Periodic Placement', () => {
      expect(elementWikiUrl('Hydrogen')).toBe('https://en.wikipedia.org/wiki/Hydrogen');
      expect(elementWikiUrl('Sodium')).toBe('https://en.wikipedia.org/wiki/Sodium');
      expect(elementWikiUrl('Helium')).toBe('https://en.wikipedia.org/wiki/Helium');
    });

    it('uses IUPAC spellings from PTP element data', () => {
      expect(elementWikiUrl('Aluminium')).toBe('https://en.wikipedia.org/wiki/Aluminium');
      expect(elementWikiUrl('Caesium')).toBe('https://en.wikipedia.org/wiki/Caesium');
    });

    it('returns null for empty name', () => {
      expect(elementWikiUrl('')).toBeNull();
      expect(elementWikiUrl('   ')).toBeNull();
    });
  });

  describe('resolveElementName', () => {
    it('prefers element.name', () => {
      expect(resolveElementName({ symbol: 'Na', name: 'Sodium' })).toBe('Sodium');
    });

    it('looks up name by symbol when name missing', () => {
      expect(resolveElementName({ symbol: 'Fe' })).toBe('Iron');
    });
  });

  describe('elementWikiUrlFromElement', () => {
    it('resolves wiki URL from symbol only', () => {
      expect(elementWikiUrlFromElement({ symbol: 'Cl' })).toBe('https://en.wikipedia.org/wiki/Chlorine');
    });
  });
});
