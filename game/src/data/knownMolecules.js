/**
 * Known molecule combos for Periodic Table Poker.
 *
 * Deck: 118 cards — exactly one card per element symbol (see elements.js).
 * A combo means each distinct element in the formula appears at least once
 * among hole + community cards (one card per symbol).
 * Subscripts in labels (H₂O, CO₂, CH₄) are chemistry shorthand only — not counts.
 * Invalid: formulas that need the same symbol twice (O₂, N₂) — impossible with this deck.
 */
import { ELEMENTS } from './elements.js';

/** Index of molecule lists on Wikipedia. */
export const MOLECULES_WIKI_INDEX = 'https://en.wikipedia.org/wiki/Lists_of_molecules';

/** Tier used for non-molecule (atomic mass) hands — below all molecule tiers. */
export const MASS_TIER = 5;

const VALID_SYMBOLS = new Set(ELEMENTS.map((el) => el.symbol));

export const KNOWN_MOLECULES = {
  chonp: {
    id: 'chonp',
    label: 'CHONP',
    name: 'DNA (life atoms)',
    wikiUrl: 'https://en.wikipedia.org/wiki/DNA',
    symbols: ['C', 'H', 'O', 'N', 'P'],
    tier: 1,
    cardHint: 'C + H + O + N + P',
  },
  h2o: {
    id: 'h2o',
    label: 'H₂O',
    name: 'Water',
    wikiUrl: 'https://en.wikipedia.org/wiki/Water',
    symbols: ['H', 'O'],
    tier: 2,
    cardHint: 'H + O',
  },
  nacl: {
    id: 'nacl',
    label: 'NaCl',
    name: 'Sodium chloride',
    wikiUrl: 'https://en.wikipedia.org/wiki/Sodium_chloride',
    symbols: ['Na', 'Cl'],
    tier: 3,
    cardHint: 'Na + Cl',
  },
  co2: {
    id: 'co2',
    label: 'CO₂',
    name: 'Carbon dioxide',
    wikiUrl: 'https://en.wikipedia.org/wiki/Carbon_dioxide',
    symbols: ['C', 'O'],
    tier: 4,
    cardHint: 'C + O',
  },
};

/** Molecules checked in tier order (best first). */
export const MOLECULE_CHECK_ORDER = Object.values(KNOWN_MOLECULES).sort(
  (a, b) => a.tier - b.tier,
);

/** Formulas that require duplicate element cards — not playable with a 118-card deck. */
export const INVALID_DUPLICATE_ONLY_FORMULAS = [
  { label: 'O₂', symbols: ['O', 'O'] },
  { label: 'N₂', symbols: ['N', 'N'] },
  { label: 'H₂', symbols: ['H', 'H'] },
  { label: 'Cl₂', symbols: ['Cl', 'Cl'] },
];

export function validateMoleculeDefinition(mol) {
  if (!mol?.id || !mol.symbols?.length) {
    throw new Error('Molecule definition must have id and symbols');
  }
  const seen = new Set();
  for (const symbol of mol.symbols) {
    if (seen.has(symbol)) {
      throw new Error(`Molecule ${mol.id}: duplicate symbol "${symbol}" — deck has one card each`);
    }
    seen.add(symbol);
    if (!VALID_SYMBOLS.has(symbol)) {
      throw new Error(`Molecule ${mol.id}: unknown symbol "${symbol}"`);
    }
  }
}

function validateAllKnownMolecules() {
  for (const mol of Object.values(KNOWN_MOLECULES)) {
    validateMoleculeDefinition(mol);
  }
}

validateAllKnownMolecules();

function countSymbols(cards) {
  const counts = {};
  (cards || []).forEach((c) => {
    const s = c?.symbol;
    if (s) counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

/** Returns molecule id when all required element cards are present, else null. */
export function matchMoleculeCombo(holeCards, communityCards) {
  const counts = countSymbols([...(holeCards || []), ...(communityCards || [])]);
  for (const mol of MOLECULE_CHECK_ORDER) {
    if (mol.symbols.every((s) => (counts[s] || 0) >= 1)) return mol.id;
  }
  return null;
}

export function isDuplicateOnlyFormula(symbols) {
  return new Set(symbols).size !== symbols.length;
}

export function getKnownMolecule(combo) {
  if (!combo) return null;
  return KNOWN_MOLECULES[combo] ?? null;
}

export function moleculeWikiUrl(combo) {
  return getKnownMolecule(combo)?.wikiUrl ?? null;
}

export function isSymbolInKnownMolecule(symbol, combo) {
  const mol = getKnownMolecule(combo);
  if (!mol || !symbol) return false;
  return mol.symbols.includes(symbol);
}

export function moleculeDisplayLabel(combo) {
  return getKnownMolecule(combo)?.label ?? '';
}

export function moleculeCardsDescription(combo) {
  const mol = getKnownMolecule(combo);
  if (!mol) return '';
  return `${mol.label} (${mol.name}) — ${mol.cardHint}`;
}

export function knownMoleculeLinkTitle(mol) {
  return moleculeCardsDescription(mol.id);
}

/** Human-readable ranking for rules copy: CHONP → H₂O → … → mass */
export function moleculeRankingLabel() {
  const labels = MOLECULE_CHECK_ORDER.map((m) => m.label);
  labels.push('best mass');
  return labels.join(' → ');
}
