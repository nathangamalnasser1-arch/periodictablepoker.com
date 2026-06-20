/** Index of molecule lists on Wikipedia. */
export const MOLECULES_WIKI_INDEX = 'https://en.wikipedia.org/wiki/Lists_of_molecules';

export const KNOWN_MOLECULES = {
  chonp: {
    id: 'chonp',
    label: 'CHONP',
    name: 'DNA (C, H, O, N, P — life atoms)',
    wikiUrl: 'https://en.wikipedia.org/wiki/DNA',
    symbols: ['C', 'H', 'O', 'N', 'P'],
  },
  h2o: {
    id: 'h2o',
    label: 'H₂O',
    name: 'Water',
    wikiUrl: 'https://en.wikipedia.org/wiki/Water',
    symbols: ['H', 'O'],
  },
  nacl: {
    id: 'nacl',
    label: 'NaCl',
    name: 'Sodium chloride',
    wikiUrl: 'https://en.wikipedia.org/wiki/Sodium_chloride',
    symbols: ['Na', 'Cl'],
  },
};

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
