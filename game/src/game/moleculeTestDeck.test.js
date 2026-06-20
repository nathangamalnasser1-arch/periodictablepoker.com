import { describe, it, expect } from 'vitest';
import { CATALOG_MOLECULE_IDS } from '../data/moleculeCatalog.js';
import { buildMoleculeTestDeck, verifyMoleculeTestDeck } from './moleculeTestDeck.js';

describe('moleculeTestDeck', () => {
  it.each(CATALOG_MOLECULE_IDS)('stacked deck gives player 0 catalog molecule %s after flop', (moleculeId) => {
    const { ok, holeCards, communityCards } = verifyMoleculeTestDeck({
      moleculeId,
      numPlayers: 5,
      winnerIndex: 0,
    });
    expect(ok, `failed for ${moleculeId}`).toBe(true);
    expect(holeCards).toHaveLength(2);
    expect(communityCards).toHaveLength(3);
  });

  it('builds a 118-card deck with unique symbols', () => {
    const deck = buildMoleculeTestDeck({ moleculeId: 'sio2', numPlayers: 5, winnerIndex: 0 });
    expect(deck).toHaveLength(118);
    const symbols = deck.map((c) => c.symbol);
    expect(new Set(symbols).size).toBe(118);
  });

  it('places CHONP like intro game 3 pattern', () => {
    const deck = buildMoleculeTestDeck({ moleculeId: 'chonp', numPlayers: 5, winnerIndex: 0 });
    expect(deck[0].symbol).toBe('C');
    expect(deck[1].symbol).toBe('H');
    expect(deck[10].symbol).toBe('O');
    expect(deck[11].symbol).toBe('N');
    expect(deck[12].symbol).toBe('P');
  });

  it('places two-symbol molecules in hole only', () => {
    const deck = buildMoleculeTestDeck({ moleculeId: 'nacl', numPlayers: 5, winnerIndex: 0 });
    expect(deck[0].symbol).toBe('Na');
    expect(deck[1].symbol).toBe('Cl');
  });
});
