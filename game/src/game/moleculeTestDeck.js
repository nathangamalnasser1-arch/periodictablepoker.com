import { createDeck, shuffle } from '../data/elements.js';
import { getCatalogMolecule, catalogSymbolsPresent } from '../data/moleculeCatalog.js';

/**
 * Stack the deck so winnerIndex has the target catalog molecule after the flop.
 * 2 symbols → both in hole; 3 → 2 hole + 1 flop; 4 → 2 hole + 2 flop; 5 → 2 hole + 3 flop.
 */
export function buildMoleculeTestDeck({ moleculeId, numPlayers, winnerIndex = 0 }) {
  const mol = getCatalogMolecule(moleculeId);
  if (!mol) throw new Error(`Unknown molecule: ${moleculeId}`);

  const full = createDeck();
  const bySymbol = (s) => full.find((c) => c.symbol === s);
  const usedSymbols = new Set(mol.symbols);
  const deck = [...full];
  shuffle(deck);

  const hole0 = winnerIndex * 2;
  const hole1 = winnerIndex * 2 + 1;
  const flopBase = numPlayers * 2;
  const symbols = [...mol.symbols];
  const holeCount = Math.min(2, symbols.length);
  const flopCount = Math.max(0, symbols.length - holeCount);

  const fixedPositions = new Set();

  for (let i = 0; i < holeCount; i++) {
    const pos = i === 0 ? hole0 : hole1;
    deck[pos] = bySymbol(symbols[i]);
    fixedPositions.add(pos);
  }
  for (let i = 0; i < flopCount; i++) {
    const pos = flopBase + i;
    deck[pos] = bySymbol(symbols[holeCount + i]);
    fixedPositions.add(pos);
  }

  const filler = full.filter((c) => !usedSymbols.has(c?.symbol));
  shuffle(filler);
  let r = 0;
  for (let i = 0; i < deck.length; i++) {
    if (!fixedPositions.has(i)) {
      deck[i] = filler[r++];
    }
  }

  return deck;
}

/** Verify winner has catalog molecule symbols after simulated hole + flop deal. */
export function verifyMoleculeTestDeck({ moleculeId, numPlayers, winnerIndex = 0 }) {
  const deck = buildMoleculeTestDeck({ moleculeId, numPlayers, winnerIndex });
  const holeCards = [deck[winnerIndex * 2], deck[winnerIndex * 2 + 1]];
  const communityCards = [deck[numPlayers * 2], deck[numPlayers * 2 + 1], deck[numPlayers * 2 + 2]];
  const ok = catalogSymbolsPresent(moleculeId, holeCards, communityCards);
  return { ok, holeCards, communityCards, moleculeId };
}
