/**
 * Catalog of 50 playable molecules for testing and future ranking.
 *
 * Deck rule: one card per element; subscripts are chemistry shorthand only.
 * Overlapping symbol sets (e.g. CO₂ and CO both need C + O) are distinct catalog
 * entries — live play highlights highest-tier KNOWN_MOLECULES match only.
 */
import { validateMoleculeDefinition } from './knownMolecules.js';

function entry(id, label, name, symbols, wikiSlug) {
  const cardHint = symbols.join(' + ');
  return {
    id,
    label,
    name,
    symbols,
    cardHint,
    wikiUrl: `https://en.wikipedia.org/wiki/${wikiSlug}`,
  };
}

export const MOLECULE_CATALOG = {
  chonp: entry('chonp', 'CHONP', 'DNA (life atoms)', ['C', 'H', 'O', 'N', 'P'], 'DNA'),
  h2o: entry('h2o', 'H₂O', 'Water', ['H', 'O'], 'Water'),
  nacl: entry('nacl', 'NaCl', 'Sodium chloride', ['Na', 'Cl'], 'Sodium_chloride'),
  co2: entry('co2', 'CO₂', 'Carbon dioxide', ['C', 'O'], 'Carbon_dioxide'),
  ch4: entry('ch4', 'CH₄', 'Methane', ['C', 'H'], 'Methane'),
  nh3: entry('nh3', 'NH₃', 'Ammonia', ['N', 'H'], 'Ammonia'),
  hcl: entry('hcl', 'HCl', 'Hydrogen chloride', ['H', 'Cl'], 'Hydrogen_chloride'),
  hf: entry('hf', 'HF', 'Hydrogen fluoride', ['H', 'F'], 'Hydrogen_fluoride'),
  hbr: entry('hbr', 'HBr', 'Hydrogen bromide', ['H', 'Br'], 'Hydrogen_bromide'),
  hi: entry('hi', 'HI', 'Hydrogen iodide', ['H', 'I'], 'Hydrogen_iodide'),
  h2s: entry('h2s', 'H₂S', 'Hydrogen sulfide', ['H', 'S'], 'Hydrogen_sulfide'),
  sio2: entry('sio2', 'SiO₂', 'Silicon dioxide', ['Si', 'O'], 'Silicon_dioxide'),
  cao: entry('cao', 'CaO', 'Calcium oxide', ['Ca', 'O'], 'Calcium_oxide'),
  mgo: entry('mgo', 'MgO', 'Magnesium oxide', ['Mg', 'O'], 'Magnesium_oxide'),
  fe2o3: entry('fe2o3', 'Fe₂O₃', 'Iron oxide', ['Fe', 'O'], 'Iron(III)_oxide'),
  al2o3: entry('al2o3', 'Al₂O₃', 'Aluminium oxide', ['Al', 'O'], 'Aluminium_oxide'),
  cuo: entry('cuo', 'CuO', 'Copper(II) oxide', ['Cu', 'O'], 'Copper(II)_oxide'),
  zno: entry('zno', 'ZnO', 'Zinc oxide', ['Zn', 'O'], 'Zinc_oxide'),
  tio2: entry('tio2', 'TiO₂', 'Titanium dioxide', ['Ti', 'O'], 'Titanium_dioxide'),
  sno2: entry('sno2', 'SnO₂', 'Tin dioxide', ['Sn', 'O'], 'Tin(IV)_oxide'),
  pbo: entry('pbo', 'PbO', 'Lead(II) oxide', ['Pb', 'O'], 'Lead(II)_oxide'),
  hgo: entry('hgo', 'HgO', 'Mercury(II) oxide', ['Hg', 'O'], 'Mercury(II)_oxide'),
  kcl: entry('kcl', 'KCl', 'Potassium chloride', ['K', 'Cl'], 'Potassium_chloride'),
  cacl2: entry('cacl2', 'CaCl₂', 'Calcium chloride', ['Ca', 'Cl'], 'Calcium_chloride'),
  agcl: entry('agcl', 'AgCl', 'Silver chloride', ['Ag', 'Cl'], 'Silver_chloride'),
  lif: entry('lif', 'LiF', 'Lithium fluoride', ['Li', 'F'], 'Lithium_fluoride'),
  fes: entry('fes', 'FeS', 'Iron(II) sulfide', ['Fe', 'S'], 'Iron(II)_sulfide'),
  cs2: entry('cs2', 'CS₂', 'Carbon disulfide', ['C', 'S'], 'Carbon_disulfide'),
  sic: entry('sic', 'SiC', 'Silicon carbide', ['Si', 'C'], 'Silicon_carbide'),
  bn: entry('bn', 'BN', 'Boron nitride', ['B', 'N'], 'Boron_nitride'),
  pf3: entry('pf3', 'PF₃', 'Phosphorus trifluoride', ['P', 'F'], 'Phosphorus_trifluoride'),
  sf6: entry('sf6', 'SF₆', 'Sulfur hexafluoride', ['S', 'F'], 'Sulfur_hexafluoride'),
  wc: entry('wc', 'WC', 'Tungsten carbide', ['W', 'C'], 'Tungsten_carbide'),
  naoh: entry('naoh', 'NaOH', 'Sodium hydroxide', ['Na', 'O', 'H'], 'Sodium_hydroxide'),
  hno3: entry('hno3', 'HNO₃', 'Nitric acid', ['H', 'N', 'O'], 'Nitric_acid'),
  h2so4: entry('h2so4', 'H₂SO₄', 'Sulfuric acid', ['H', 'S', 'O'], 'Sulfuric_acid'),
  h3po4: entry('h3po4', 'H₃PO₄', 'Phosphoric acid', ['H', 'P', 'O'], 'Phosphoric_acid'),
  ch3oh: entry('ch3oh', 'CH₃OH', 'Methanol', ['C', 'H', 'O'], 'Methanol'),
  caco3: entry('caco3', 'CaCO₃', 'Calcium carbonate', ['Ca', 'C', 'O'], 'Calcium_carbonate'),
  nahco3: entry('nahco3', 'NaHCO₃', 'Sodium bicarbonate', ['Na', 'H', 'C', 'O'], 'Sodium_bicarbonate'),
  kno3: entry('kno3', 'KNO₃', 'Potassium nitrate', ['K', 'N', 'O'], 'Potassium_nitrate'),
  nh4cl: entry('nh4cl', 'NH₄Cl', 'Ammonium chloride', ['N', 'H', 'Cl'], 'Ammonium_chloride'),
  baso4: entry('baso4', 'BaSO₄', 'Barium sulfate', ['Ba', 'S', 'O'], 'Barium_sulfate'),
  mgso4: entry('mgso4', 'MgSO₄', 'Magnesium sulfate', ['Mg', 'S', 'O'], 'Magnesium_sulfate'),
  na2so4: entry('na2so4', 'Na₂SO₄', 'Sodium sulfate', ['Na', 'S', 'O'], 'Sodium_sulfate'),
  kmno4: entry('kmno4', 'KMnO₄', 'Potassium permanganate', ['K', 'Mn', 'O'], 'Potassium_permanganate'),
  li2co3: entry('li2co3', 'Li₂CO₃', 'Lithium carbonate', ['Li', 'C', 'O'], 'Lithium_carbonate'),
  urea: entry('urea', 'Urea', 'Urea', ['C', 'N', 'O', 'H'], 'Urea'),
  hcn: entry('hcn', 'HCN', 'Hydrogen cyanide', ['H', 'C', 'N'], 'Hydrogen_cyanide'),
  kcn: entry('kcn', 'KCN', 'Potassium cyanide', ['K', 'C', 'N'], 'Potassium_cyanide'),
};

/** Ordered ids 1–50 for molecule test sessions. */
export const CATALOG_MOLECULE_IDS = Object.keys(MOLECULE_CATALOG);

export const MOLECULE_CATALOG_COUNT = CATALOG_MOLECULE_IDS.length;

export function getCatalogMolecule(id) {
  if (!id) return null;
  return MOLECULE_CATALOG[id] ?? null;
}

/** 1-based catalog index → molecule entry. */
export function getCatalogMoleculeByIndex(catalogIndex) {
  const id = CATALOG_MOLECULE_IDS[catalogIndex - 1];
  return id ? getCatalogMolecule(id) : null;
}

function countSymbols(cards) {
  const counts = {};
  (cards || []).forEach((c) => {
    const s = c?.symbol;
    if (s) counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

/** Whether hole + community contain every symbol for this catalog molecule. */
export function catalogSymbolsPresent(moleculeId, holeCards, communityCards) {
  const mol = getCatalogMolecule(moleculeId);
  if (!mol) return false;
  const counts = countSymbols([...(holeCards || []), ...(communityCards || [])]);
  return mol.symbols.every((s) => (counts[s] || 0) >= 1);
}

export function isSymbolInCatalogMolecule(symbol, moleculeId) {
  const mol = getCatalogMolecule(moleculeId);
  if (!mol || !symbol) return false;
  return mol.symbols.includes(symbol);
}

function validateAllCatalogMolecules() {
  if (CATALOG_MOLECULE_IDS.length !== 50) {
    throw new Error(`Expected 50 catalog molecules, got ${CATALOG_MOLECULE_IDS.length}`);
  }
  for (const mol of Object.values(MOLECULE_CATALOG)) {
    validateMoleculeDefinition(mol);
    if (!mol.wikiUrl?.startsWith('https://')) {
      throw new Error(`Molecule ${mol.id}: missing wikiUrl`);
    }
  }
}

validateAllCatalogMolecules();
