/**
 * youknObtainium - Shedding card game with periodic table elements.
 * 1 human vs 4 AI. Match by family, stable molecules, ferromagnetism combo.
 *
 * © 2025 Nathan Gamal Nasser. All rights reserved.
 * Proprietary software. See LICENSE in the project root.
 */

(function () {
  'use strict';

  // --- Element data: 118 elements, 4 families (s=0, p=1, d=2, f=3) ---
  const ELEMENT_LIST = [
    { z: 1, sym: 'H', name: 'Hydrogen', family: 0 }, { z: 2, sym: 'He', name: 'Helium', family: 0 },
    { z: 3, sym: 'Li', name: 'Lithium', family: 0 }, { z: 4, sym: 'Be', name: 'Beryllium', family: 0 },
    { z: 5, sym: 'B', name: 'Boron', family: 1 }, { z: 6, sym: 'C', name: 'Carbon', family: 1 },
    { z: 7, sym: 'N', name: 'Nitrogen', family: 1 }, { z: 8, sym: 'O', name: 'Oxygen', family: 1 },
    { z: 9, sym: 'F', name: 'Fluorine', family: 1 }, { z: 10, sym: 'Ne', name: 'Neon', family: 1 },
    { z: 11, sym: 'Na', name: 'Sodium', family: 0 }, { z: 12, sym: 'Mg', name: 'Magnesium', family: 0 },
    { z: 13, sym: 'Al', name: 'Aluminium', family: 1 }, { z: 14, sym: 'Si', name: 'Silicon', family: 1 },
    { z: 15, sym: 'P', name: 'Phosphorus', family: 1 }, { z: 16, sym: 'S', name: 'Sulfur', family: 1 },
    { z: 17, sym: 'Cl', name: 'Chlorine', family: 1 }, { z: 18, sym: 'Ar', name: 'Argon', family: 1 },
    { z: 19, sym: 'K', name: 'Potassium', family: 0 }, { z: 20, sym: 'Ca', name: 'Calcium', family: 0 },
    { z: 21, sym: 'Sc', name: 'Scandium', family: 2 }, { z: 22, sym: 'Ti', name: 'Titanium', family: 2 },
    { z: 23, sym: 'V', name: 'Vanadium', family: 2 }, { z: 24, sym: 'Cr', name: 'Chromium', family: 2 },
    { z: 25, sym: 'Mn', name: 'Manganese', family: 2 }, { z: 26, sym: 'Fe', name: 'Iron', family: 2 },
    { z: 27, sym: 'Co', name: 'Cobalt', family: 2 }, { z: 28, sym: 'Ni', name: 'Nickel', family: 2 },
    { z: 29, sym: 'Cu', name: 'Copper', family: 2 }, { z: 30, sym: 'Zn', name: 'Zinc', family: 2 },
    { z: 31, sym: 'Ga', name: 'Gallium', family: 1 }, { z: 32, sym: 'Ge', name: 'Germanium', family: 1 },
    { z: 33, sym: 'As', name: 'Arsenic', family: 1 }, { z: 34, sym: 'Se', name: 'Selenium', family: 1 },
    { z: 35, sym: 'Br', name: 'Bromine', family: 1 }, { z: 36, sym: 'Kr', name: 'Krypton', family: 1 },
    { z: 37, sym: 'Rb', name: 'Rubidium', family: 0 }, { z: 38, sym: 'Sr', name: 'Strontium', family: 0 },
    { z: 39, sym: 'Y', name: 'Yttrium', family: 2 }, { z: 40, sym: 'Zr', name: 'Zirconium', family: 2 },
    { z: 41, sym: 'Nb', name: 'Niobium', family: 2 }, { z: 42, sym: 'Mo', name: 'Molybdenum', family: 2 },
    { z: 43, sym: 'Tc', name: 'Technetium', family: 2 }, { z: 44, sym: 'Ru', name: 'Ruthenium', family: 2 },
    { z: 45, sym: 'Rh', name: 'Rhodium', family: 2 }, { z: 46, sym: 'Pd', name: 'Palladium', family: 2 },
    { z: 47, sym: 'Ag', name: 'Silver', family: 2 }, { z: 48, sym: 'Cd', name: 'Cadmium', family: 2 },
    { z: 49, sym: 'In', name: 'Indium', family: 1 }, { z: 50, sym: 'Sn', name: 'Tin', family: 1 },
    { z: 51, sym: 'Sb', name: 'Antimony', family: 1 }, { z: 52, sym: 'Te', name: 'Tellurium', family: 1 },
    { z: 53, sym: 'I', name: 'Iodine', family: 1 }, { z: 54, sym: 'Xe', name: 'Xenon', family: 1 },
    { z: 55, sym: 'Cs', name: 'Caesium', family: 0 }, { z: 56, sym: 'Ba', name: 'Barium', family: 0 },
    { z: 57, sym: 'La', name: 'Lanthanum', family: 3 }, { z: 58, sym: 'Ce', name: 'Cerium', family: 3 },
    { z: 59, sym: 'Pr', name: 'Praseodymium', family: 3 }, { z: 60, sym: 'Nd', name: 'Neodymium', family: 3 },
    { z: 61, sym: 'Pm', name: 'Promethium', family: 3 }, { z: 62, sym: 'Sm', name: 'Samarium', family: 3 },
    { z: 63, sym: 'Eu', name: 'Europium', family: 3 }, { z: 64, sym: 'Gd', name: 'Gadolinium', family: 3 },
    { z: 65, sym: 'Tb', name: 'Terbium', family: 3 }, { z: 66, sym: 'Dy', name: 'Dysprosium', family: 3 },
    { z: 67, sym: 'Ho', name: 'Holmium', family: 3 }, { z: 68, sym: 'Er', name: 'Erbium', family: 3 },
    { z: 69, sym: 'Tm', name: 'Thulium', family: 3 }, { z: 70, sym: 'Yb', name: 'Ytterbium', family: 3 },
    { z: 71, sym: 'Lu', name: 'Lutetium', family: 3 }, { z: 72, sym: 'Hf', name: 'Hafnium', family: 2 },
    { z: 73, sym: 'Ta', name: 'Tantalum', family: 2 }, { z: 74, sym: 'W', name: 'Tungsten', family: 2 },
    { z: 75, sym: 'Re', name: 'Rhenium', family: 2 }, { z: 76, sym: 'Os', name: 'Osmium', family: 2 },
    { z: 77, sym: 'Ir', name: 'Iridium', family: 2 }, { z: 78, sym: 'Pt', name: 'Platinum', family: 2 },
    { z: 79, sym: 'Au', name: 'Gold', family: 2 }, { z: 80, sym: 'Hg', name: 'Mercury', family: 2 },
    { z: 81, sym: 'Tl', name: 'Thallium', family: 1 }, { z: 82, sym: 'Pb', name: 'Lead', family: 1 },
    { z: 83, sym: 'Bi', name: 'Bismuth', family: 1 }, { z: 84, sym: 'Po', name: 'Polonium', family: 1 },
    { z: 85, sym: 'At', name: 'Astatine', family: 1 }, { z: 86, sym: 'Rn', name: 'Radon', family: 1 },
    { z: 87, sym: 'Fr', name: 'Francium', family: 0 }, { z: 88, sym: 'Ra', name: 'Radium', family: 0 },
    { z: 89, sym: 'Ac', name: 'Actinium', family: 3 }, { z: 90, sym: 'Th', name: 'Thorium', family: 3 },
    { z: 91, sym: 'Pa', name: 'Protactinium', family: 3 }, { z: 92, sym: 'U', name: 'Uranium', family: 3 },
    { z: 93, sym: 'Np', name: 'Neptunium', family: 3 }, { z: 94, sym: 'Pu', name: 'Plutonium', family: 3 },
    { z: 95, sym: 'Am', name: 'Americium', family: 3 }, { z: 96, sym: 'Cm', name: 'Curium', family: 3 },
    { z: 97, sym: 'Bk', name: 'Berkelium', family: 3 }, { z: 98, sym: 'Cf', name: 'Californium', family: 3 },
    { z: 99, sym: 'Es', name: 'Einsteinium', family: 3 }, { z: 100, sym: 'Fm', name: 'Fermium', family: 3 },
    { z: 101, sym: 'Md', name: 'Mendelevium', family: 3 }, { z: 102, sym: 'No', name: 'Nobelium', family: 3 },
    { z: 103, sym: 'Lr', name: 'Lawrencium', family: 3 }, { z: 104, sym: 'Rf', name: 'Rutherfordium', family: 2 },
    { z: 105, sym: 'Db', name: 'Dubnium', family: 2 }, { z: 106, sym: 'Sg', name: 'Seaborgium', family: 2 },
    { z: 107, sym: 'Bh', name: 'Bohrium', family: 2 }, { z: 108, sym: 'Hs', name: 'Hassium', family: 2 },
    { z: 109, sym: 'Mt', name: 'Meitnerium', family: 2 }, { z: 110, sym: 'Ds', name: 'Darmstadtium', family: 2 },
    { z: 111, sym: 'Rg', name: 'Roentgenium', family: 2 }, { z: 112, sym: 'Cn', name: 'Copernicium', family: 2 },
    { z: 113, sym: 'Nh', name: 'Nihonium', family: 1 }, { z: 114, sym: 'Fl', name: 'Flerovium', family: 1 },
    { z: 115, sym: 'Mc', name: 'Moscovium', family: 1 }, { z: 116, sym: 'Lv', name: 'Livermorium', family: 1 },
    { z: 117, sym: 'Ts', name: 'Tennessine', family: 1 }, { z: 118, sym: 'Og', name: 'Oganesson', family: 1 }
  ];

  const ELEMENTS_BY_SYM = {};
  ELEMENT_LIST.forEach(function (el, idx) {
    ELEMENTS_BY_SYM[el.sym] = Object.assign({ index: idx }, el);
  });

  // Melting points (K) for metals - used by Temperature cards to "melt" and discard
  const MELTING_K = {
    Hg: 234, Cs: 302, Ga: 303, K: 337, Na: 371, Li: 454, Sn: 505, Bi: 545, Pb: 601, Cd: 594,
    Zn: 693, Sb: 904, Mg: 923, Al: 933, Ag: 1235, Au: 1338, Cu: 1358, Mn: 1520, Fe: 1811,
    Co: 1768, Ni: 1728, Pd: 1828, Pt: 2041, Ti: 1941, Cr: 2180, V: 2183, Zr: 2128, Rh: 2237,
    Ru: 2607, Hf: 2506, Nb: 2750, Mo: 2896, Tc: 2430, W: 3695, Re: 3459, Os: 3306, Ir: 2719,
    Be: 1560, Ca: 1115, Sr: 1050, Ba: 1000, Ra: 973, La: 1193, Ce: 1068, Pr: 1208, Nd: 1297,
    Pm: 1315, Sm: 1345, Eu: 1099, Gd: 1585, Tb: 1629, Dy: 1680, Ho: 1734, Er: 1802, Tm: 1818,
    Yb: 1097, Lu: 1925, Ac: 1323, Th: 2115, Pa: 1841, U: 1405, Np: 917, Pu: 913, Am: 1449,
    Cm: 1613, Bk: 1259, Cf: 1173, In: 430, Tl: 577
  };

  const METAL_SYMS = Object.keys(MELTING_K);

  // Radioactive elements: decay (auto-discard) after DECAY_TURNS in hand
  const RADIOACTIVE_SYMS = ['Tc', 'Pm', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'];
  const DECAY_TURNS = 3;

  // Ferromagnetism: elements that count as "Ferromagnetism" cards for the combo effect
  const FERROMAGNETIC_SYMS = ['Fe', 'Ni', 'Co', 'Nd', 'Gd', 'Dy', 'Sm', 'Tc'];
  // Combo: Nd + Fe + B + (Co or Ni)
  const FERRO_COMBO_REQUIRED = ['Nd', 'Fe', 'B'];
  const FERRO_COMBO_FOURTH = ['Co', 'Ni'];

  // Fission / Fusion: action cards that change family matching (familyRemap)
  const FISSION_CARD = { type: 'fission', id: 'fission', label: 'Fission' };
  const FUSION_CARD = { type: 'fusion', id: 'fusion', label: 'Fusion' };
  const EVENT_HORIZON_CARD = { type: 'eventHorizon', id: 'eventHorizon', label: 'Event Horizon' };
  const TEMPERATURE_CARDS = [
    { type: 'temperature', valueK: 300, label: '300 K' },
    { type: 'temperature', valueK: 600, label: '600 K' },
    { type: 'temperature', valueK: 1000, label: '1000 K' },
    { type: 'temperature', valueK: 1500, label: '1500 K' },
    { type: 'temperature', valueK: 2500, label: '2500 K' }
  ];

  // Stable molecules: one card per distinct element (deck has one of each). At least one card must match top family.
  // Many 2-element molecules so players often have a batch-shed option.
  const STABLE_MOLECULES = [
    ['H', 'O'],                // H2O
    ['C', 'O'],                // CO2
    ['Na', 'Cl'],              // NaCl
    ['C', 'H'],                // CH4
    ['S', 'O'],                // SO3
    ['N', 'H'],                // NH3
    ['Ca', 'O'],               // CaO
    ['Fe', 'O'],               // FeO
    ['Si', 'O'],               // SiO2
    ['P', 'O'],                // PO4
    ['C', 'Cl'],               // CCl4
    ['C', 'H', 'O'],           // CH2O
    ['H', 'Cl'],               // HCl
    ['K', 'Cl'],               // KCl
    ['Li', 'F'],               // LiF
    ['Mg', 'O'],               // MgO
    ['H', 'S'],                // H2S
    ['N', 'O'],                // NO
    ['Al', 'O'],               // Al2O3
    ['Zn', 'O'],               // ZnO
    ['Cu', 'O'],               // CuO
    ['Ba', 'O'],               // BaO
    ['Sr', 'O']                // SrO
  ];
  const MOLECULE_NAMES = ['H₂O', 'CO₂', 'NaCl', 'CH₄', 'SO₃', 'NH₃', 'CaO', 'FeO', 'SiO₂', 'PO₄', 'CCl₄', 'CH₂O', 'HCl', 'KCl', 'LiF', 'MgO', 'H₂S', 'NO', 'Al₂O₃', 'ZnO', 'CuO', 'BaO', 'SrO'];
  const MOLECULE_USES = [
    'Water — life, solvent, reactions.',
    'Carbon dioxide — respiration, photosynthesis, carbonation.',
    'Sodium chloride — table salt, electrolyte.',
    'Methane — natural gas, fuel.',
    'Sulfur trioxide — sulfuric acid, industry.',
    'Ammonia — fertilizer, cleaning.',
    'Calcium oxide — quicklime, cement.',
    'Iron(II) oxide — wüstite, metallurgy.',
    'Silicon dioxide — sand, glass, quartz.',
    'Phosphate — bones, DNA, fertilizers.',
    'Carbon tetrachloride — solvent (historical).',
    'Formaldehyde — preservative, building block for plastics.',
    'Hydrogen chloride — acid, industry.',
    'Potassium chloride — salt substitute, fertilizer.',
    'Lithium fluoride — optics, batteries.',
    'Magnesium oxide — refractory, antacid.',
    'Hydrogen sulfide — odorant, geothermal.',
    'Nitric oxide — signaling, combustion.',
    'Aluminium oxide — sapphire, abrasive.',
    'Zinc oxide — sunscreen, rubber.',
    'Copper(II) oxide — pigment, catalyst.',
    'Barium oxide — cathode, glass.',
    'Strontium oxide — ceramics, flares.'
  ];
  const FERRO_COMBO_USE = 'When the deck has cards: if one of the four combo cards matches the last played card, you may batch shed all four. When the deck is empty, you may batch shed whenever you have the combo. Then the next player performs a batch attack: they collect all Ferromagnetism cards (Fe, Ni, Co, Nd, Gd, Dy, Sm, Tc) from every other player\'s hand into their own hand in one go.';

  function moleculeNameForPlay(play) {
    if (!play || play.length <= 1) return null;
    var syms = play.map(function (c) { return c.sym; }).sort();
    for (var i = 0; i < STABLE_MOLECULES.length; i++) {
      var mol = STABLE_MOLECULES[i].slice().sort();
      if (syms.length === mol.length && syms.every(function (s, j) { return s === mol[j]; })) return MOLECULE_NAMES[i];
    }
    return null;
  }
  function moleculeUseForName(name) {
    var i = MOLECULE_NAMES.indexOf(name);
    return i >= 0 && MOLECULE_USES[i] ? MOLECULE_USES[i] : '';
  }

  function shuffle(arr) {
    var i = arr.length, j, t;
    while (i) {
      j = Math.floor(Math.random() * i--);
      t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function isElementCard(card) {
    return card.sym !== undefined && card.family !== undefined;
  }

  function isSpecialCard(card) {
    return card && (card.type === 'fission' || card.type === 'fusion' || card.type === 'temperature' || card.type === 'eventHorizon');
  }

  function getEffectiveFamily(card) {
    if (!card || !isElementCard(card)) return null;
    var remap = state.familyRemap;
    return remap ? remap[card.family] : card.family;
  }

  function buildDeck() {
    var deck = [];
    ELEMENT_LIST.forEach(function (el) {
      deck.push({ sym: el.sym, family: el.family, z: el.z });
    });
    [FISSION_CARD, FISSION_CARD, FUSION_CARD, FUSION_CARD, EVENT_HORIZON_CARD].forEach(function (c) {
      deck.push({ type: c.type, id: c.id, label: c.label });
    });
    TEMPERATURE_CARDS.forEach(function (c) {
      deck.push({ type: 'temperature', valueK: c.valueK, label: c.label });
    });
    return shuffle(deck);
  }

  function handToMultiset(hand) {
    var m = {};
    hand.forEach(function (c) {
      m[c.sym] = (m[c.sym] || 0) + 1;
    });
    return m;
  }

  function multisetContains(handMultiset, molecule) {
    var need = {};
    molecule.forEach(function (s) { need[s] = (need[s] || 0) + 1; });
    for (var sym in need) {
      if ((handMultiset[sym] || 0) < need[sym]) return false;
    }
    return true;
  }

  function multisetRemove(handMultiset, molecule) {
    var m = Object.assign({}, handMultiset);
    molecule.forEach(function (s) {
      m[s] = (m[s] || 0) - 1;
      if (m[s] <= 0) delete m[s];
    });
    return m;
  }

  function handFromMultiset(multiset, fullHand) {
    var used = {};
    var out = [];
    Object.keys(multiset).forEach(function (sym) {
      var count = multiset[sym];
      for (var i = 0; i < fullHand.length && count > 0; i++) {
        if (fullHand[i].sym === sym && (used[i] === undefined || used[i] < multiset[sym] + (used[i] || 0))) {
          if (!used[i]) used[i] = 0;
          used[i]++;
          count--;
          out.push(fullHand[i]);
        }
      }
    });
    return out;
  }

  function pickCardsForMolecule(hand, molecule) {
    var need = {};
    molecule.forEach(function (s) { need[s] = (need[s] || 0) + 1; });
    var picked = [];
    for (var i = 0; i < hand.length; i++) {
      var s = hand[i].sym;
      if (need[s] > 0) {
        need[s]--;
        picked.push(hand[i]);
      }
    }
    return Object.keys(need).every(function (s) { return need[s] <= 0; }) ? picked : null;
  }

  function getActiveTemperatureK(topCard) {
    if (topCard && topCard.type === 'temperature') return topCard.valueK;
    return state.activeTemperatureK;
  }

  function getLegalPlays(hand, topCard) {
    var plays = [];
    // When deck is empty: may shed single cards, full molecules (any time you can shed a molecule), or ferro combo
    if (state.deck.length === 0) {
      hand.forEach(function (c) { plays.push([c]); });
      STABLE_MOLECULES.forEach(function (mol) {
        var picked = pickCardsForMolecule(hand, mol);
        if (picked && picked.length > 1) plays.push(picked);
      });
      var ferro = playFerroComboFromHand(hand);
      if (ferro) plays.push(ferro);
      return plays;
    }
    var topFamily = null;
    var topIsTemperature = topCard && topCard.type === 'temperature';
    if (topCard && isElementCard(topCard)) topFamily = getEffectiveFamily(topCard);
    if (topCard && topIsTemperature) topFamily = null;

    if (!topCard) {
      hand.forEach(function (c) {
        if (isElementCard(c)) plays.push([c]);
        if (isSpecialCard(c)) plays.push([c]);
      });
      var ferro = playFerroComboFromHand(hand);
      if (ferro) plays.push(ferro);
      return plays;
    }

    // Fission, Fusion, Temperature: always legal when in hand (action cards)
    hand.forEach(function (card) {
      if (card.type === 'fission' || card.type === 'fusion' || card.type === 'temperature' || card.type === 'eventHorizon') plays.push([card]);
    });

    // When top is a temperature card (oven): can only play metals that melt (mp < temp) — they are discarded
    if (topIsTemperature) {
      var tempK = topCard.valueK;
      hand.forEach(function (card) {
        if (isElementCard(card) && METAL_SYMS.indexOf(card.sym) !== -1 && MELTING_K[card.sym] < tempK) {
          plays.push([card]);
        }
      });
      return plays;
    }

    // Melt: when activeTemperatureK is set, can discard any metal that melts
    var activeTemp = getActiveTemperatureK(topCard);
    if (activeTemp != null) {
      hand.forEach(function (card) {
        if (isElementCard(card) && METAL_SYMS.indexOf(card.sym) !== -1 && MELTING_K[card.sym] < activeTemp) {
          plays.push([card]);
        }
      });
    }

    if (topFamily == null) {
      if (topCard && (topCard.type === 'fission' || topCard.type === 'fusion')) {
        hand.forEach(function (card) {
          if (isElementCard(card)) plays.push([card]);
        });
      }
      return plays;
    }

    hand.forEach(function (card) {
      if (isElementCard(card) && getEffectiveFamily(card) === topFamily) plays.push([card]);
    });

    STABLE_MOLECULES.forEach(function (mol) {
      var picked = pickCardsForMolecule(hand, mol);
      if (!picked || picked.length <= 1) return;
      var atLeastOneMatches = picked.some(function (c) { return getEffectiveFamily(c) === topFamily; });
      if (atLeastOneMatches) plays.push(picked);
    });

    // Ferromagnetism combo: same rule as molecules — at least one of the four must match the last played card
    var ferro = playFerroComboFromHand(hand);
    if (ferro && ferro.some(function (c) { return getEffectiveFamily(c) === topFamily; })) plays.push(ferro);

    return plays;
  }

  function canPlayFerroCombo(hand) {
    var syms = hand.map(function (c) { return c.sym; });
    var hasRequired = FERRO_COMBO_REQUIRED.every(function (s) { return syms.indexOf(s) !== -1; });
    if (!hasRequired) return false;
    var hasFourth = FERRO_COMBO_FOURTH.some(function (s) { return syms.indexOf(s) !== -1; });
    return hasFourth;
  }

  function playFerroComboFromHand(hand) {
    var need = FERRO_COMBO_REQUIRED.slice();
    var fourth = null;
    FERRO_COMBO_FOURTH.forEach(function (s) { if (!fourth) fourth = s; });
    var combo = [];
    var i;
    for (i = 0; i < hand.length && need.length > 0; i++) {
      if (need.indexOf(hand[i].sym) !== -1) {
        combo.push(hand[i]);
        need.splice(need.indexOf(hand[i].sym), 1);
      }
    }
    for (i = 0; i < hand.length; i++) {
      if (FERRO_COMBO_FOURTH.indexOf(hand[i].sym) !== -1 && combo.indexOf(hand[i]) === -1) {
        combo.push(hand[i]);
        break;
      }
    }
    return combo.length === 4 ? combo : null;
  }

  // --- Game state ---
  var state = {
    deck: [],
    hands: [[], [], [], [], []],
    currentPlayer: 0,
    topCard: null,
    discardPile: [],
    initialDealDone: false,
    pendingFerro: false,
    lastPlayedCards: null,
    lastWinExplanation: null,
    familyRemap: null,
    activeTemperatureK: null,
    turnNumber: 0,
    playLog: [],
    history: [],
    historyIndex: 0,
    isMultiplayer: false,
    myPlayerIndex: 0,
    numPlayers: 5,
    openCards: false,
    onStateChange: null,
    winnerIndex: undefined,
    wonWithEventHorizon: false,
    revealedOpponents: { 1: false, 2: false, 3: false, 4: false },
    tutorialRulesShown: {},
    tutorialPopupOpen: false
  };

  var TUTORIAL_RULES = {
    deck: {
      title: 'Deck',
      body: 'The deck has 118 unique element cards (one per element) plus 2 Fission, 2 Fusion, 1 Event Horizon, and 5 Temperature action cards. Be the first to empty your hand. If the draw pile runs out, the next player (and each player in turn) may shed any card(s) they want—no matching required—until someone empties their hand and wins.'
    },
    families: {
      title: 'Families (matching)',
      body: 'Four families act like "colors": <strong>Alkali Metals (Group 1)</strong> (● blue), <strong>Alkaline Earth Metals (Group 2)</strong> (▲ green), <strong>Chalcogens (Group 16)</strong> (■ amber), <strong>Halogens (Group 17)</strong> (◆ purple). You may play a card if its family matches the current card on the table. Shapes and colors are both used for colorblind accessibility.'
    },
    molecules: {
      title: 'Stable molecules',
      body: 'You may play multiple cards at once if they form a known stable molecule (e.g. H₂O, CO₂, NaCl, CH₄) and at least one of the cards matches the current family. The deck has one card per element, so each molecule uses one card per distinct element (e.g. H₂O is played with one H and one O).'
    },
    ferromagnetism: {
      title: 'Ferromagnetism combo',
      body: 'If you have <strong>Nd + Fe + B + (Co or Ni)</strong>, you may <strong>batch shed</strong> all four when <strong>one of the four combo cards</strong> matches the last played card (or whenever the deck is empty). Then the <strong>next player</strong> performs a <strong>batch attack</strong>: they collect all Ferromagnetism cards (Fe, Ni, Co, Nd, Gd, Dy, Sm, Tc) from every other player\'s hand into their own hand in one go.'
    },
    fissionFusion: {
      title: 'Fission & Fusion',
      body: 'Fission and Fusion are action cards. When played, they change how family matching works for subsequent plays (family remap). <strong>Fission</strong> — Chalcogens (orange) are treated as Alkali (blue) for matching. <strong>Fusion</strong> — Chalcogens are treated as Alkaline Earth (green).'
    },
    temperature: {
      title: 'Temperature (melt metals)',
      body: 'Temperature cards (300 K, 600 K, 1000 K, 1500 K, 2500 K) let you "melt" metals: any metal in your hand with a melting point at or below the card\'s temperature is discarded from your hand. Remaining cards stay. Then the temperature card is discarded and play continues.'
    },
    eventHorizon: {
      title: 'Event Horizon',
      body: 'When you play the Event Horizon card, all of your remaining cards disintegrate (are discarded) and you win the game immediately.'
    },
    radioactiveDecay: {
      title: 'Radioactive decay',
      body: 'Radioactive elements (e.g. Tc, Pm, Po, U, Pu, and many heavy elements) decay if held too long. After <strong>3 full rounds</strong> (one round = all players take one turn), each such card still in your hand is automatically discarded. The count is per card from when it entered your hand.'
    },
    draw: {
      title: 'Draw',
      body: 'If you cannot play any card, you must draw one card. If that card is playable, you may play it immediately in the same turn.'
    },
    playersAI: {
      title: 'Players & AI',
      body: 'Single-player: you (Player 0) vs 4 AI bots. Bot 1 uses a Dijkstra-style "shortest path" strategy; the others use Minimax-style defensive play. In multiplayer, 2–5 human players join via the lobby.'
    }
  };

  function showMoleculeRulePopup(title, body) {
    var popup = document.getElementById('molecule-rule-popup');
    var titleEl = document.getElementById('molecule-rule-popup-title');
    var bodyEl = document.getElementById('molecule-rule-popup-body');
    if (popup && titleEl && bodyEl) {
      titleEl.textContent = title;
      bodyEl.textContent = body;
      popup.style.display = 'flex';
    }
  }
  function closeMoleculeRulePopup() {
    var popup = document.getElementById('molecule-rule-popup');
    if (popup) popup.style.display = 'none';
  }
  function closeTutorialPopup() {
    var popup = document.getElementById('tutorial-popup');
    if (popup) popup.style.display = 'none';
    state.tutorialPopupOpen = false;
    if (!state.isMultiplayer && state.currentPlayer >= 1 && state.currentPlayer < getNumPlayers() && (state.winnerIndex === undefined || state.winnerIndex < 0)) {
      setTimeout(doAITurn, 400);
    }
  }

  function tryShowTutorialRule(ruleKey) {
    var toggle = document.getElementById('toggle-tutorial');
    if (!toggle || !toggle.checked) return;
    if (state.tutorialPopupOpen) return;
    if (state.tutorialRulesShown[ruleKey]) return;
    var rule = TUTORIAL_RULES[ruleKey];
    if (!rule) return;
    state.tutorialRulesShown[ruleKey] = true;
    var popup = document.getElementById('tutorial-popup');
    var titleEl = document.getElementById('tutorial-popup-title');
    var bodyEl = document.getElementById('tutorial-popup-body');
    if (!popup || !titleEl || !bodyEl) return;
    titleEl.textContent = rule.title;
    bodyEl.innerHTML = rule.body;
    state.tutorialPopupOpen = true;
    popup.style.display = 'flex';
  }

  var gameOverRedirectScheduled = false;
  var SCORES_KEY = 'youknObtainium_scores';

  function getScores() {
    try {
      var raw = localStorage.getItem(SCORES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveScore(entry) {
    var list = getScores();
    list.push(entry);
    try {
      localStorage.setItem(SCORES_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function saveScoreToFirestore(entry, onDone) {
    if (!window.firebase || !window.FIREBASE_CONFIG || window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      if (onDone) onDone(false);
      return;
    }
    if (!window.firebase.apps || !window.firebase.apps.length) {
      try { window.firebase.initializeApp(window.FIREBASE_CONFIG); } catch (e) { if (onDone) onDone(false); return; }
    }
    var db = window.firebase.firestore();
    db.collection('scoreboard').add({
      name: entry.name,
      turns: entry.turns,
      date: entry.date,
      lastCard: entry.lastCard || '—',
      eventHorizon: !!entry.eventHorizon
    }).then(function () { if (onDone) onDone(true); }).catch(function () { if (onDone) onDone(false); });
  }

  function cloneCard(c) {
    if (!c) return c;
    var o = {};
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) o[k] = c[k];
    return o;
  }

  function cloneState() {
    return {
      deck: state.deck.map(cloneCard),
      hands: state.hands.map(function (h) { return h.map(cloneCard); }),
      currentPlayer: state.currentPlayer,
      topCard: state.topCard ? cloneCard(state.topCard) : null,
      discardPile: state.discardPile.map(cloneCard),
      familyRemap: state.familyRemap ? state.familyRemap.slice() : null,
      activeTemperatureK: state.activeTemperatureK,
      turnNumber: state.turnNumber,
      winnerIndex: state.winnerIndex,
      numPlayers: state.numPlayers,
      lastPlayedCards: state.lastPlayedCards ? state.lastPlayedCards.map(cloneCard) : null,
      lastWinExplanation: state.lastWinExplanation != null ? state.lastWinExplanation : null,
      wonWithEventHorizon: !!state.wonWithEventHorizon
    };
  }

  function restoreState(snap) {
    state.deck = snap.deck.map(cloneCard);
    state.hands = snap.hands.map(function (h) { return h.map(cloneCard); });
    if (snap.numPlayers != null) state.numPlayers = snap.numPlayers;
    state.currentPlayer = snap.currentPlayer;
    state.topCard = snap.topCard ? cloneCard(snap.topCard) : null;
    state.discardPile = snap.discardPile.map(cloneCard);
    state.familyRemap = snap.familyRemap ? snap.familyRemap.slice() : null;
    state.activeTemperatureK = snap.activeTemperatureK;
    state.turnNumber = snap.turnNumber;
    state.winnerIndex = snap.winnerIndex;
    state.lastPlayedCards = snap.lastPlayedCards ? snap.lastPlayedCards.map(cloneCard) : null;
    state.lastWinExplanation = snap.lastWinExplanation != null ? snap.lastWinExplanation : null;
    state.wonWithEventHorizon = !!snap.wonWithEventHorizon;
  }

  function getStateSnapshot() {
    return cloneState();
  }

  function applyStateFromMultiplayer(snap) {
    if (!snap || !snap.deck) return;
    var prevWinner = state.winnerIndex;
    if (snap.numPlayers != null) state.numPlayers = snap.numPlayers;
    restoreState(snap);
    if (snap.winnerIndex === undefined && prevWinner !== undefined && prevWinner >= 0) {
      state.winnerIndex = prevWinner;
      state.currentPlayer = -1;
    }
    state.initialDealDone = true;
    if (typeof updateUI === 'function') updateUI();
  }

  function setMultiplayer(mode, myIndex, numPlayers) {
    state.isMultiplayer = !!mode;
    state.myPlayerIndex = mode ? myIndex : 0;
    if (mode && numPlayers != null) state.numPlayers = numPlayers;
  }

  function setOpenCards(open) {
    state.openCards = !!open;
  }

  function setOnStateChange(fn) {
    state.onStateChange = fn;
  }

  function saveToHistory() {
    state.history.push(cloneState());
    state.historyIndex = state.history.length - 1;
  }

  function isReplayMode() {
    return state.history.length > 0 && state.historyIndex < state.history.length - 1;
  }

  function updateReplayButtons() {
    var backBtn = document.getElementById('btn-back');
    var fwdBtn = document.getElementById('btn-forward');
    var statusEl = document.getElementById('replay-status');
    if (!backBtn || !fwdBtn) return;
    backBtn.disabled = state.historyIndex <= 0;
    fwdBtn.disabled = state.historyIndex >= state.history.length - 1 || state.history.length === 0;
    if (statusEl) {
      if (isReplayMode()) {
        statusEl.textContent = 'Viewing step ' + (state.historyIndex + 1) + ' of ' + state.history.length;
      } else {
        statusEl.textContent = state.history.length ? 'Live' : '';
      }
    }
  }

  var FAMILY_NAMES = ['Alkali Metals (Group 1)', 'Alkaline Earth Metals (Group 2)', 'Chalcogens (Group 16)', 'Halogens (Group 17)'];

  function playerName(playerIndex) {
    return playerIndex === getLocalPlayerIndex() ? 'You' : (state.isMultiplayer ? 'Player ' + (playerIndex + 1) : 'Bot ' + playerIndex);
  }

  function cardsLabel(cards) {
    return cards.map(function (c) { return c.sym || c.label || c.id || c.type; }).join(', ');
  }

  function explainPlay(playerIndex, cards, previousTop, result) {
    var who = playerName(playerIndex);
    var label = cardsLabel(cards);
    var explanation = '';

    if (cards.length === 0) return null;

    var played = cards[0];
    if (state.deck.length === 0 && played.type !== 'eventHorizon') {
      if (result && result.ferro) {
        explanation = 'Deck empty — Ferromagnetism combo (Nd+Fe+B+Co/Ni) — ' + playerName(result.next) + ' collects all magnetic cards from other hands.';
      } else if (cards.length > 1 && isElementCard(played)) {
        var molDesc = cards.map(function (c) { return c.sym; }).join('');
        explanation = 'Deck empty — shed full molecule (' + molDesc + ').';
      } else {
        explanation = 'Deck empty — any card could be shed.';
      }
      return { who: who, cards: label, explanation: explanation };
    }
    if (played.type === 'fission') {
      explanation = 'Fission played — Chalcogens (Group 16) now count as Alkali Metals (Group 1) for matching.';
    } else if (played.type === 'fusion') {
      explanation = 'Fusion played — Chalcogens (Group 16) now count as Alkaline Earth Metals (Group 2) for matching.';
    } else if (played.type === 'eventHorizon') {
      explanation = 'Event Horizon — all your cards disintegrated. You win!';
    } else if (played.type === 'temperature') {
      explanation = played.label + ' — metals with melting point below this can be melted (discarded).';
    } else if (result && result.ferro) {
      explanation = 'Ferromagnetism combo (Nd+Fe+B+Co/Ni) — ' + playerName(result.next) + ' collects all magnetic cards from other hands.';
    } else if (cards.length > 1 && isElementCard(played)) {
      var molDesc = cards.map(function (c) { return c.sym; }).join('');
      explanation = 'Stable molecule (' + molDesc + ') — matched family; discarded ' + cards.length + ' cards.';
    } else if (isElementCard(played) && previousTop && previousTop.type === 'temperature' && METAL_SYMS.indexOf(played.sym) !== -1 && MELTING_K[played.sym] < previousTop.valueK) {
      explanation = 'Melted ' + played.sym + ' (' + MELTING_K[played.sym] + ' K < ' + previousTop.valueK + ' K) — discarded.';
    } else if (isElementCard(played) && previousTop) {
      var fam = getEffectiveFamily(played);
      explanation = 'Matched ' + FAMILY_NAMES[fam] + ' (same family as top).';
    } else if (isElementCard(played)) {
      explanation = 'Played on table (no previous top).';
    } else {
      explanation = 'Played ' + label + '.';
    }

    return { who: who, cards: label, explanation: explanation };
  }

  function addToLog(entry) {
    if (!entry) return;
    state.playLog.push(entry);
    var logEl = document.getElementById('play-log');
    if (!logEl) return;
    var div = document.createElement('div');
    div.className = 'play-log-entry';
    div.innerHTML = '<span class="who">' + entry.who + '</span>: ' + entry.cards + ' — <span class="explanation">' + entry.explanation + '</span>';
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function logDecay(decayedList) {
    if (!decayedList || decayedList.length === 0) return;
    var syms = decayedList.map(function (c) { return c.sym; }).join(', ');
    addToLog({ who: 'Decay', cards: syms, explanation: 'Radioactive elements reached 0 turns — auto-discarded.' });
  }

  var HUMAN = 0;
  var NUM_PLAYERS = 5;
  var INITIAL_HAND_SIZE = 9;

  function getNumPlayers() {
    return state.isMultiplayer ? (state.numPlayers || 5) : NUM_PLAYERS;
  }

  function getLocalPlayerIndex() {
    return state.isMultiplayer ? state.myPlayerIndex : HUMAN;
  }

  function nextPlayer() {
    return (state.currentPlayer + 1) % getNumPlayers();
  }

  function setDecayOnCard(card) {
    if (card && card.sym && RADIOACTIVE_SYMS.indexOf(card.sym) !== -1) {
      card.turnsUntilDecay = DECAY_TURNS;
    }
  }

  function decayTick() {
    var n = getNumPlayers();
    for (var p = 0; p < n; p++) {
      state.hands[p].forEach(function (card) {
        if (card.sym && RADIOACTIVE_SYMS.indexOf(card.sym) !== -1 && card.turnsUntilDecay !== undefined) {
          card.turnsUntilDecay--;
        }
      });
    }
    var decayed = [];
    for (var p = 0; p < n; p++) {
      var h = state.hands[p];
      for (var i = h.length - 1; i >= 0; i--) {
        if (h[i].turnsUntilDecay <= 0) {
          decayed.push(h[i]);
          h.splice(i, 1);
        }
      }
    }
    decayed.forEach(function (c) {
      state.discardPile.push(c);
      state.topCard = c;
    });
    return decayed;
  }

  function deal() {
    gameOverRedirectScheduled = false;
    state.deck = buildDeck();
    var n = getNumPlayers();
    state.hands = [];
    for (var h = 0; h < n; h++) state.hands.push([]);
    state.discardPile = [];
    state.topCard = null;
    state.initialDealDone = false;
    state.pendingFerro = false;
    state.lastPlayedCards = null;
    state.familyRemap = null;
    state.activeTemperatureK = null;
    state.turnNumber = 0;
    state.winnerIndex = undefined;
    state.wonWithEventHorizon = false;
    state.lastWinExplanation = null;
    if (state.revealedOpponents) {
      state.revealedOpponents[1] = false;
      state.revealedOpponents[2] = false;
      state.revealedOpponents[3] = false;
      state.revealedOpponents[4] = false;
    }

    for (var i = 0; i < n; i++) {
      for (var j = 0; j < INITIAL_HAND_SIZE; j++) {
        if (state.deck.length) {
          var card = state.deck.pop();
          setDecayOnCard(card);
          state.hands[i].push(card);
        }
      }
    }

    var first = state.deck.pop();
    if (first && first.sym) setDecayOnCard(first);
    state.discardPile.push(first);
    state.topCard = first;
    state.currentPlayer = 0;
    state.initialDealDone = true;
    state.lastPlayedCards = null;
    state.lastWinExplanation = null;
    state.history = [];
    state.historyIndex = 0;
    saveToHistory();
  }

  function removeCards(hand, cardsToRemove) {
    var toRemove = cardsToRemove.slice();
    return hand.filter(function (c) {
      var idx = toRemove.indexOf(c);
      if (idx !== -1) {
        toRemove.splice(idx, 1);
        return false;
      }
      return true;
    });
  }

  function collectFerromagnetismFromOthers(targetPlayer) {
    var collected = [];
    var n = getNumPlayers();
    for (var p = 0; p < n; p++) {
      if (p === targetPlayer) continue;
      var h = state.hands[p];
      for (var i = h.length - 1; i >= 0; i--) {
        if (FERROMAGNETIC_SYMS.indexOf(h[i].sym) !== -1) {
          collected.push(h[i]);
          h.splice(i, 1);
        }
      }
    }
    collected.forEach(setDecayOnCard);
    state.hands[targetPlayer].push.apply(state.hands[targetPlayer], collected);
    return collected;
  }

  function playCards(playerIndex, cards) {
    var hand = state.hands[playerIndex];
    hand = removeCards(hand, cards);
    state.hands[playerIndex] = hand;

    if (cards.length === 4 && canPlayFerroCombo(cards)) {
      state.pendingFerro = true;
      state.lastPlayedCards = cards;
    }

    cards.forEach(function (c) { state.discardPile.push(c); });
    var played = cards[0];
    var isMelt = state.topCard && state.topCard.type === 'temperature' && cards.length === 1 &&
      isElementCard(played) && METAL_SYMS.indexOf(played.sym) !== -1 && MELTING_K[played.sym] < state.topCard.valueK;

    if (played.type === 'fission') {
      state.familyRemap = [0, 1, 0, 3];
      state.topCard = played;
    } else if (played.type === 'fusion') {
      state.familyRemap = [0, 1, 1, 3];
      state.topCard = played;
    } else if (played.type === 'eventHorizon') {
      state.hands[playerIndex].forEach(function (c) { state.discardPile.push(c); });
      state.hands[playerIndex] = [];
      state.topCard = played;
      state.winnerIndex = playerIndex;
      state.currentPlayer = -1;
      if (playerIndex === getLocalPlayerIndex()) state.wonWithEventHorizon = true;
    } else if (played.type === 'temperature') {
      state.activeTemperatureK = played.valueK;
      state.topCard = played;
    } else if (isMelt) {
      state.topCard = state.topCard;
    } else {
      state.topCard = cards[cards.length - 1];
    }

    if (state.pendingFerro) {
      var next = nextPlayer();
      var collected = collectFerromagnetismFromOthers(next);
      state.pendingFerro = false;
      return { ferro: true, collected: collected, next: next };
    }

    return { ferro: false };
  }

  function drawOne(playerIndex) {
    if (state.deck.length === 0) return null;
    var card = state.deck.pop();
    setDecayOnCard(card);
    state.hands[playerIndex].push(card);
    return card;
  }

  function hasLegalPlay(hand) {
    if (state.deck.length === 0) return hand.length > 0;
    var plays = getLegalPlays(hand, state.topCard);
    return plays.length > 0 || canPlayFerroCombo(hand);
  }

  function checkWin() {
    var n = getNumPlayers();
    for (var p = 0; p < n; p++) {
      if (state.hands[p].length === 0) return p;
    }
    return -1;
  }

  // --- AI: Dijkstra-style (minimize weighted hand cost in one step) ---
  function cardWeight(card) {
    return 1;
  }

  function handCost(hand) {
    return hand.reduce(function (sum, c) { return sum + cardWeight(c); }, 0);
  }

  function dijkstraBotMove(hand, topCard) {
    var ferro = playFerroComboFromHand(hand);
    if (ferro) {
      var after = removeCards(hand, ferro);
      return { type: 'combo', cards: ferro, cost: handCost(after) };
    }

    var plays = getLegalPlays(hand, topCard);
    var best = null;
    var bestCost = 1e9;
    plays.forEach(function (p) {
      var after = removeCards(hand, p);
      var c = handCost(after);
      if (c < bestCost) {
        bestCost = c;
        best = p;
      }
    });
    if (best && best.length > 0) return { type: 'play', cards: best, cost: bestCost };
    return null;
  }

  // --- AI: Minimax (depth 2, maximize our advantage vs human) ---
  function evalState(hands, forPlayer) {
    var our = hands[forPlayer].length;
    var human = hands[HUMAN].length;
    return -our * 2 + human;
  }

  function minimaxBotMove(hand, topCard, playerIndex) {
    var ferro = playFerroComboFromHand(hand);
    if (ferro) return { type: 'combo', cards: ferro };

    var plays = getLegalPlays(hand, topCard);
    var best = null;
    var bestScore = -1e9;

    plays.forEach(function (p) {
      var newHand = removeCards(hand, p);
      var newTop = p[p.length - 1];
      var score = evalState(
        state.hands.map(function (h, i) {
          return i === playerIndex ? newHand : h;
        }),
        playerIndex
      );
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });
    if (best && best.length > 0) return { type: 'play', cards: best };
    return null;
  }

  function getAIMove(playerIndex) {
    var hand = state.hands[playerIndex];
    var topCard = state.topCard;
    if (playerIndex === 1) return dijkstraBotMove(hand, topCard);
    return minimaxBotMove(hand, topCard, playerIndex);
  }

  // --- UI ---
  function renderCard(card, opts) {
    opts = opts || {};
    var div = document.createElement('div');
    div.className = 'card' + (opts.mini ? ' card-mini' : '');
    if (card.type === 'fission' || card.type === 'fusion' || card.type === 'temperature' || card.type === 'eventHorizon') {
      div.classList.add('card-special', 'card-' + card.type);
      div.setAttribute('data-family', 'special');
      div.setAttribute('data-sym', card.type);
      var label = card.label || card.type;
      div.innerHTML = '<span class="card-symbol">' + label + '</span><span class="card-family-icon"></span>';
    } else {
      div.setAttribute('data-family', String(card.family));
      div.setAttribute('data-sym', card.sym);
      var familyName = FAMILY_NAMES[card.family] || '';
      var meltK = card.sym && MELTING_K[card.sym];
      var meltStr = meltK != null ? meltK + ' K' : '—';
      div.innerHTML = '<span class="card-symbol">' + card.sym + '</span><span class="card-family-name">' + familyName + '</span><span class="card-melting">' + meltStr + '</span><span class="card-family-icon"></span>';
      if (card.sym && RADIOACTIVE_SYMS.indexOf(card.sym) !== -1 && card.turnsUntilDecay !== undefined) {
        var decayEl = document.createElement('span');
        decayEl.className = 'card-decay';
        decayEl.setAttribute('aria-label', 'Decay in ' + card.turnsUntilDecay + ' turns');
        decayEl.textContent = card.turnsUntilDecay;
        div.appendChild(decayEl);
      }
    }
    if (opts.playable === false) div.classList.add('unplayable');
    if (opts.selected) div.classList.add('selected');
    return div;
  }

  function updateUI() {
    var me = getLocalPlayerIndex();
    /* When deck is empty, shed-any-card rule applies; no need to end game by fewest cards. */
    var slot = document.getElementById('current-card-slot');
    slot.innerHTML = '';
    if (state.topCard) {
      slot.appendChild(renderCard(state.topCard));
    }

    var lastPlayedEl = document.getElementById('last-played-cards');
    if (lastPlayedEl) {
      lastPlayedEl.innerHTML = '';
      if (state.lastPlayedCards && state.lastPlayedCards.length > 0) {
        state.lastPlayedCards.forEach(function (c) {
          var node = renderCard(c);
          node.classList.add('card-flash');
          lastPlayedEl.appendChild(node);
        });
      }
    }

    var drawPileEl = document.getElementById('draw-pile');
    if (drawPileEl) {
      document.getElementById('draw-count').textContent = state.deck.length;
      drawPileEl.setAttribute('aria-label', state.deck.length === 0 ? 'Draw pile (empty)' : 'Draw pile');
    }

    var me = getLocalPlayerIndex();
    var handEl = document.getElementById('player-hand');
    handEl.innerHTML = '';
    var myHand = state.hands[me];
    var plays = getLegalPlays(myHand, state.topCard);
    var isMyTurn = !state.isMultiplayer || state.currentPlayer === state.myPlayerIndex;
    var playableIndices = {};
    var moleculeNameByIndex = {};
    var moleculeNamesShown = [];
    var ferroIndices = {};
    plays.forEach(function (p) {
      var molName = moleculeNameForPlay(p);
      if (molName && moleculeNamesShown.indexOf(molName) === -1) moleculeNamesShown.push(molName);
      p.forEach(function (c) {
        var idx = handIndex(myHand, c);
        if (idx !== -1) {
          playableIndices[idx] = true;
          if (molName) moleculeNameByIndex[idx] = molName;
        }
      });
    });
    if (isMyTurn && canPlayFerroCombo(myHand)) {
      var ferroCards = playFerroComboFromHand(myHand);
      if (ferroCards) ferroCards.forEach(function (c) {
        var idx = handIndex(myHand, c);
        if (idx !== -1) ferroIndices[idx] = true;
      });
    }
    myHand.forEach(function (c, i) {
      var playable = isMyTurn && (playableIndices[i] || (state.topCard && isElementCard(c) && getEffectiveFamily(c) === getEffectiveFamily(state.topCard)));
      if (isMyTurn && canPlayFerroCombo(myHand)) playable = true;
      var node = renderCard(c, { playable: playable });
      node.setAttribute('data-hand-index', i);
      if (moleculeNameByIndex[i]) {
        node.classList.add('in-molecule');
        node.setAttribute('data-molecule', moleculeNameByIndex[i]);
        node.setAttribute('title', 'Click to batch shed as ' + moleculeNameByIndex[i] + ' (molecule)');
      }
      if (ferroIndices[i]) {
        node.classList.add('in-ferro');
        node.setAttribute('data-ferro', '1');
        node.setAttribute('title', 'Click to batch shed as Ferromagnetism combo (Nd+Fe+B+Co/Ni)');
      }
      handEl.appendChild(node);
    });
    var ferroInPlays = isMyTurn && plays.some(function (p) {
      if (p.length !== 4) return false;
      var syms = p.map(function (c) { return c.sym; });
      return syms.indexOf('Nd') !== -1 && syms.indexOf('Fe') !== -1 && syms.indexOf('B') !== -1 && (syms.indexOf('Co') !== -1 || syms.indexOf('Ni') !== -1);
    });
    var moleculeHintEl = document.getElementById('molecule-hint');
    if (moleculeHintEl) {
      if (isMyTurn && (moleculeNamesShown.length > 0 || ferroInPlays)) {
        moleculeHintEl.classList.add('batch-shed-callout');
        var parts = [];
        if (moleculeNamesShown.length > 0) parts.push('Molecule: ' + moleculeNamesShown.join(', '));
        if (ferroInPlays) parts.push('Ferromagnetism combo');
        moleculeHintEl.innerHTML = '<strong>Batch shed available</strong> — ' + parts.join(' · ') + '. <strong>Click any highlighted card below</strong> to play (accent border = molecule, orange border = Ferro).';
        moleculeHintEl.style.display = '';
      } else {
        moleculeHintEl.classList.remove('batch-shed-callout');
        moleculeHintEl.style.display = 'none';
      }
    }

    var handLabelEl = document.querySelector('.hand-label');
    if (handLabelEl) handLabelEl.textContent = state.isMultiplayer ? 'You (Player ' + (me + 1) + ')' : 'You (Player 0)';

    var nPlayers = getNumPlayers();
    var opponents = [];
    for (var p = 0; p < nPlayers; p++) {
      if (p !== me) opponents.push(p);
    }
    var showOpponentCards = function (slot) {
      return state.openCards || (state.revealedOpponents && state.revealedOpponents[slot]);
    };
    for (var slot = 1; slot <= 4; slot++) {
      var cardsEl = document.getElementById('ai-cards-' + slot);
      var aiHandEl = document.getElementById('ai-hand-' + slot);
      var slotEl = document.querySelector('.ai-player[data-player-id="' + slot + '"]');
      var seatEl = document.querySelector('.oval-table .seat-opp[data-player-id="' + slot + '"]');
      var oppIndex = slot - 1;
      if (oppIndex < opponents.length) {
        var opp = opponents[oppIndex];
        if (cardsEl) cardsEl.textContent = state.hands[opp].length;
        if (aiHandEl) {
          aiHandEl.innerHTML = '';
          if (state.isMultiplayer && !state.openCards) {
            var countSpan = document.createElement('span');
            countSpan.className = 'opponent-cards-count';
            countSpan.textContent = state.hands[opp].length + ' card' + (state.hands[opp].length === 1 ? '' : 's');
            aiHandEl.appendChild(countSpan);
          } else if (showOpponentCards(slot)) {
            state.hands[opp].forEach(function (c) {
              aiHandEl.appendChild(renderCard(c, { mini: true }));
            });
          }
        }
        if (seatEl) seatEl.setAttribute('data-revealed', showOpponentCards(slot) ? 'true' : 'false');
        if (slotEl) {
          slotEl.style.display = '';
          slotEl.setAttribute('data-active', state.currentPlayer === opp ? 'true' : 'false');
          var nameEl = slotEl.querySelector('.ai-name');
          if (nameEl) nameEl.textContent = state.isMultiplayer ? 'Player ' + (opp + 1) : 'Bot ' + opp;
        }
      } else if (slotEl) {
        slotEl.style.display = 'none';
      }
      if (seatEl) seatEl.style.display = oppIndex < opponents.length ? '' : 'none';
    }

    var turnEl = document.getElementById('turn-indicator');
    if (state.winnerIndex >= 0) {
      turnEl.textContent = 'Game over';
      turnEl.style.color = 'var(--text-muted)';
    } else if (state.currentPlayer === me) {
      turnEl.textContent = 'Your turn';
      turnEl.style.color = 'var(--success)';
    } else {
      turnEl.textContent = state.isMultiplayer ? ('Player ' + (state.currentPlayer + 1) + '\'s turn') : ('Bot ' + state.currentPlayer + '\'s turn');
      turnEl.style.color = 'var(--accent)';
    }

    var openCardsCheckbox = document.getElementById('toggle-open-cards');
    if (openCardsCheckbox) openCardsCheckbox.checked = state.openCards;

    var drawBtn = document.getElementById('btn-draw');
    drawBtn.disabled = isReplayMode() || state.currentPlayer !== state.myPlayerIndex || hasLegalPlay(myHand) || state.deck.length === 0;
    if (drawBtn) {
      drawBtn.textContent = state.deck.length === 0 ? 'Draw card (deck empty)' : 'Draw card';
      drawBtn.setAttribute('title', state.deck.length === 0 ? 'Deck is empty — shed any card to continue. First to empty their hand wins.' : '');
    }

    var msgEl = document.getElementById('message-area');
    if (msgEl && state.deck.length === 0 && (state.winnerIndex === undefined || state.winnerIndex < 0)) {
      msgEl.textContent = 'Deck is empty — shed any card you want. First to empty your hand wins.';
    }

    var winnerBanner = document.getElementById('winner-banner');
    if (winnerBanner) {
      var winnerTitleEl = document.getElementById('winner-banner-title');
      var winnerCardReasonEl = document.getElementById('winner-card-reason');
      var winnerCardsDisplayEl = document.getElementById('winner-cards-display');
      var winnerExplanationEl = document.getElementById('winner-explanation');
      if (state.winnerIndex >= 0) {
        var winnerText = state.winnerIndex === me ? 'You win!' : (state.isMultiplayer ? 'Player ' + (state.winnerIndex + 1) + ' wins!' : 'Bot ' + state.winnerIndex + ' wins!');
        if (winnerTitleEl) winnerTitleEl.textContent = state.wonWithEventHorizon ? '◉ EVENT HORIZON — You win! ◉' : 'Game over — ' + winnerText;
        winnerBanner.style.display = 'block';
        winnerBanner.classList.toggle('winner-banner-event-horizon', !!state.wonWithEventHorizon);
        if (state.winnerIndex === me && winnerCardReasonEl && winnerCardsDisplayEl && winnerExplanationEl && state.lastPlayedCards && state.lastPlayedCards.length > 0) {
          winnerCardReasonEl.style.display = 'block';
          winnerCardsDisplayEl.innerHTML = '';
          state.lastPlayedCards.forEach(function (c) {
            winnerCardsDisplayEl.appendChild(renderCard(c));
          });
          winnerExplanationEl.textContent = state.lastWinExplanation || '';
        } else if (winnerCardReasonEl) {
          winnerCardReasonEl.style.display = 'none';
        }
        if (state.wonWithEventHorizon) document.body.classList.add('event-horizon-bg');
        else document.body.classList.remove('event-horizon-bg');
        if (!gameOverRedirectScheduled) {
          gameOverRedirectScheduled = true;
          if (state.isMultiplayer) {
            setTimeout(function () {
              window.location.href = 'lobby.html';
            }, 30000);
          }
        }
        /* Single-player: no auto-refresh; user clicks New Game when ready */
      } else {
        winnerBanner.style.display = 'none';
        winnerBanner.classList.remove('winner-banner-event-horizon');
        document.body.classList.remove('event-horizon-bg');
        if (winnerCardReasonEl) winnerCardReasonEl.style.display = 'none';
      }
    }
    var gameOverPanel = document.getElementById('game-over-panel');
    if (gameOverPanel) {
      if (state.winnerIndex === me) {
        gameOverPanel.style.display = 'block';
        gameOverPanel.dataset.turns = String(state.turnNumber);
        gameOverPanel.dataset.lastCard = state.lastPlayedCards && state.lastPlayedCards.length ? cardsLabel(state.lastPlayedCards) : '—';
        gameOverPanel.dataset.eventHorizon = state.wonWithEventHorizon ? '1' : '0';
        var turnsEl = document.getElementById('game-over-turns');
        var lastCardEl = document.getElementById('game-over-last-card');
        if (turnsEl) turnsEl.textContent = state.turnNumber;
        if (lastCardEl) lastCardEl.textContent = gameOverPanel.dataset.lastCard;
        var gameOverWhyEl = document.getElementById('game-over-why');
        if (gameOverWhyEl) gameOverWhyEl.textContent = state.lastWinExplanation || '—';
        var submittedMsg = document.getElementById('score-submitted-msg');
        var submitBtn = document.getElementById('btn-submit-score');
        if (submittedMsg) submittedMsg.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
      } else {
        gameOverPanel.style.display = 'none';
      }
    }

    updateReplayButtons();
  }

  function handIndex(hand, card) {
    for (var i = 0; i < hand.length; i++) {
      if (hand[i] === card) return i;
    }
    return -1;
  }

  function doHumanPlay(cards) {
    var me = getLocalPlayerIndex();
    if (state.tutorialPopupOpen || state.currentPlayer !== me || isReplayMode()) return;
    var prevTop = state.topCard;
    var result = playCards(me, cards);
    state.lastPlayedCards = cards;
    if (state.winnerIndex === undefined || state.winnerIndex < 0) {
      state.currentPlayer = nextPlayer();
      state.turnNumber++;
    }
    if (state.currentPlayer === me) {
      var decayed = decayTick();
      if (decayed.length) {
        logDecay(decayed);
        tryShowTutorialRule('radioactiveDecay');
      }
    }
    var entry = explainPlay(me, cards, prevTop, result);
    if (entry) addToLog(entry);
    if (entry && cards[0]) {
      var p = cards[0];
      if (p.type === 'eventHorizon') tryShowTutorialRule('eventHorizon');
      else if (p.type === 'fission' || p.type === 'fusion') tryShowTutorialRule('fissionFusion');
      else if (p.type === 'temperature') tryShowTutorialRule('temperature');
      else if (result && result.ferro) tryShowTutorialRule('ferromagnetism');
      else if (cards.length > 1 && isElementCard(p)) tryShowTutorialRule('molecules');
      else if (isElementCard(p) && prevTop && prevTop.type === 'temperature' && METAL_SYMS.indexOf(p.sym) !== -1 && MELTING_K[p.sym] < prevTop.valueK) tryShowTutorialRule('temperature');
      else if (isElementCard(p) && prevTop) tryShowTutorialRule('families');
    }
    var msgEl = document.getElementById('message-area');
    msgEl.textContent = entry ? entry.who + ': ' + entry.cards + ' — ' + entry.explanation : '';
    var winner = checkWin();
    if (winner >= 0) {
      state.winnerIndex = winner;
      state.currentPlayer = -1;
      if (winner === me && cards[0] && cards[0].type === 'eventHorizon') state.wonWithEventHorizon = true;
      if (winner === me) state.lastWinExplanation = entry ? entry.explanation : '';
      msgEl.textContent = winner === me ? 'You win!' : (state.isMultiplayer ? 'Player ' + (winner + 1) + ' wins!' : 'Bot ' + winner + ' wins!');
    }
    saveToHistory();
    updateUI();
    if (state.onStateChange) state.onStateChange(getStateSnapshot());
    if (!state.isMultiplayer && state.currentPlayer >= 1 && state.currentPlayer < getNumPlayers()) setTimeout(doAITurn, 600);
  }

  function doHumanDraw() {
    var me = getLocalPlayerIndex();
    if (state.tutorialPopupOpen || state.currentPlayer !== me || isReplayMode()) return;
    if (state.deck.length === 0) {
      var msgEl = document.getElementById('message-area');
      if (msgEl) msgEl.textContent = 'Deck is empty — shed any card you want. First to empty your hand wins.';
      tryShowTutorialRule('deck');
      saveToHistory();
      updateUI();
      if (state.onStateChange) state.onStateChange(getStateSnapshot());
      return;
    }
    if (hasLegalPlay(state.hands[me])) return;
    var card = drawOne(me);
    state.lastPlayedCards = card ? [card] : null;
    var canPlayNow = card && hasLegalPlay(state.hands[me]);
    var msg = 'You drew ' + (card ? (card.sym || card.label) : '') + (canPlayNow ? '. You may play it now!' : ' (no legal play).');
    addToLog({ who: 'You', cards: 'Draw', explanation: msg });
    tryShowTutorialRule('draw');
    document.getElementById('message-area').textContent = msg;
    if (!canPlayNow) {
      state.currentPlayer = nextPlayer();
      state.turnNumber++;
      if (state.currentPlayer === me) {
        var decayed = decayTick();
        if (decayed.length) {
          logDecay(decayed);
          tryShowTutorialRule('radioactiveDecay');
        }
      }
      saveToHistory();
      if (state.onStateChange) state.onStateChange(getStateSnapshot());
      if (!state.isMultiplayer && (state.winnerIndex === undefined || state.winnerIndex < 0)) setTimeout(doAITurn, 400);
    } else {
      saveToHistory();
      if (state.onStateChange) state.onStateChange(getStateSnapshot());
    }
    updateUI();
  }

  function doAITurn() {
    tryShowTutorialRule('playersAI');
    if (state.tutorialPopupOpen || state.currentPlayer < 1 || state.currentPlayer >= getNumPlayers() || isReplayMode()) return;
    var bot = state.currentPlayer;
    try {
      runAITurnLogic();
    } catch (e) {
      if (typeof console !== 'undefined' && console.error) console.error('doAITurn error:', e);
      state.currentPlayer = nextPlayer();
      state.turnNumber++;
      updateUI();
      if (state.winnerIndex >= 0) return;
      if (state.currentPlayer >= 1 && state.currentPlayer < getNumPlayers()) {
        setTimeout(doAITurn, 600);
      }
    }
  }

  function runAITurnLogic() {
    var bot = state.currentPlayer;
    var move = getAIMove(bot);
    if (move && move.cards && move.cards.length > 0) {
      var prevTop = state.topCard;
      var result = playCards(bot, move.cards);
      state.lastPlayedCards = move.cards;
      if (state.winnerIndex >= 0) {
        saveToHistory();
        updateUI();
        if (state.onStateChange) state.onStateChange(getStateSnapshot());
        return;
      }
      if (state.winnerIndex === undefined || state.winnerIndex < 0) {
        state.currentPlayer = nextPlayer();
        state.turnNumber++;
      }
      if (state.currentPlayer === HUMAN) {
        var decayed = decayTick();
        if (decayed.length) logDecay(decayed);
      }
      var entry = explainPlay(bot, move.cards, prevTop, result);
      if (entry) addToLog(entry);
      if (entry && move.cards[0]) {
        var p = move.cards[0];
        if (p.type === 'eventHorizon') tryShowTutorialRule('eventHorizon');
        else if (p.type === 'fission' || p.type === 'fusion') tryShowTutorialRule('fissionFusion');
        else if (p.type === 'temperature') tryShowTutorialRule('temperature');
        else if (result && result.ferro) tryShowTutorialRule('ferromagnetism');
        else if (move.cards.length > 1 && isElementCard(p)) tryShowTutorialRule('molecules');
        else if (isElementCard(p) && prevTop && prevTop.type === 'temperature' && METAL_SYMS.indexOf(p.sym) !== -1 && MELTING_K[p.sym] < prevTop.valueK) tryShowTutorialRule('temperature');
        else if (isElementCard(p) && prevTop) tryShowTutorialRule('families');
      }
      document.getElementById('message-area').textContent = entry ? entry.who + ': ' + entry.cards + ' — ' + entry.explanation : '';
      if (state.winnerIndex >= 0) {
        saveToHistory();
        updateUI();
        if (state.onStateChange) state.onStateChange(getStateSnapshot());
        return;
      }
    } else {
      if (state.deck.length > 0) {
        var drawn = drawOne(bot);
        state.lastPlayedCards = drawn ? [drawn] : null;
        addToLog({ who: 'Bot ' + bot, cards: 'Draw', explanation: 'No legal play — drew a card.' });
        tryShowTutorialRule('draw');
        document.getElementById('message-area').textContent = 'Bot ' + bot + ' drew a card (no legal play).';
        state.currentPlayer = nextPlayer();
        state.turnNumber++;
        if (state.currentPlayer === HUMAN) {
          var decayed = decayTick();
          if (decayed.length) {
            logDecay(decayed);
            tryShowTutorialRule('radioactiveDecay');
          }
        }
      } else {
        var winner = checkWin();
        if (winner >= 0) {
          state.winnerIndex = winner;
          state.currentPlayer = -1;
          document.getElementById('message-area').textContent = winner === HUMAN ? 'You win!' : (state.isMultiplayer ? 'Player ' + (winner + 1) + ' wins!' : 'Bot ' + winner + ' wins!');
          saveToHistory();
          updateUI();
          if (state.onStateChange) state.onStateChange(getStateSnapshot());
          return;
        }
        saveToHistory();
        updateUI();
        if (state.onStateChange) state.onStateChange(getStateSnapshot());
        return;
      }
    }
    saveToHistory();
    var winner = checkWin();
    if (winner >= 0) {
      state.winnerIndex = winner;
      state.currentPlayer = -1;
      document.getElementById('message-area').textContent = winner === HUMAN ? 'You win!' : (state.isMultiplayer ? 'Player ' + (winner + 1) + ' wins!' : 'Bot ' + winner + ' wins!');
      updateUI();
      if (state.onStateChange) state.onStateChange(getStateSnapshot());
      return;
    }
    if (state.winnerIndex >= 0) {
      var w = state.winnerIndex;
      document.getElementById('message-area').textContent = w === HUMAN ? 'You win!' : (state.isMultiplayer ? 'Player ' + (w + 1) + ' wins!' : 'Bot ' + w + ' wins!');
      updateUI();
      if (state.onStateChange) state.onStateChange(getStateSnapshot());
      return;
    }
    updateUI();
    if (state.currentPlayer >= 1 && state.currentPlayer < getNumPlayers()) {
      setTimeout(doAITurn, 600);
    }
  }

  function setupEventListeners() {
    document.getElementById('btn-new-game').addEventListener('click', function () {
      state.playLog = [];
      state.history = [];
      state.historyIndex = 0;
      state.tutorialRulesShown = {};
      state.tutorialPopupOpen = false;
      var logEl = document.getElementById('play-log');
      if (logEl) logEl.innerHTML = '';
      deal();
      updateUI();
      document.body.classList.add('header-hidden');
      document.getElementById('message-area').textContent = 'Match by family. Play molecules or Ferro combo when you can!';
      tryShowTutorialRule('deck');
      if (state.currentPlayer >= 1) setTimeout(doAITurn, 500);
    });

    var btnSubmitScore = document.getElementById('btn-submit-score');
    if (btnSubmitScore) {
      btnSubmitScore.addEventListener('click', function () {
        var panel = document.getElementById('game-over-panel');
        var nameEl = document.getElementById('scoreboard-name');
        var msgEl = document.getElementById('score-submitted-msg');
        if (!panel || !nameEl) return;
        var name = (nameEl.value || '').trim().slice(0, 32) || 'Player';
        var entry = {
          name: name,
          turns: parseInt(panel.dataset.turns, 10) || 0,
          lastCard: panel.dataset.lastCard || '—',
          eventHorizon: panel.dataset.eventHorizon === '1',
          date: Date.now()
        };
        saveScore(entry);
        btnSubmitScore.disabled = true;
        if (msgEl) { msgEl.style.display = 'block'; msgEl.textContent = 'Submitting…'; }
        saveScoreToFirestore(entry, function (ok) {
          if (msgEl) msgEl.textContent = ok ? 'Submitted!' : 'Saved locally. Connect to see on global scoreboard.';
        });
      });
    }

    var openCardsToggle = document.getElementById('toggle-open-cards');
    if (openCardsToggle) {
      openCardsToggle.checked = state.openCards;
      openCardsToggle.addEventListener('change', function () {
        state.openCards = !!openCardsToggle.checked;
        updateUI();
      });
    }

    var tutorialPopup = document.getElementById('tutorial-popup');
    if (tutorialPopup) {
      tutorialPopup.addEventListener('click', function (e) {
        if (e.target === tutorialPopup) closeTutorialPopup();
      });
    }
    var tutorialPopupCloseBtn = document.getElementById('tutorial-popup-close');
    if (tutorialPopupCloseBtn) tutorialPopupCloseBtn.addEventListener('click', closeTutorialPopup);

    var moleculeRulePopup = document.getElementById('molecule-rule-popup');
    if (moleculeRulePopup) moleculeRulePopup.addEventListener('click', function (e) { if (e.target === moleculeRulePopup) closeMoleculeRulePopup(); });
    var moleculeRuleCloseBtn = document.getElementById('molecule-rule-popup-close');
    if (moleculeRuleCloseBtn) moleculeRuleCloseBtn.addEventListener('click', closeMoleculeRulePopup);

    var rulesOverlay = document.getElementById('rules-overlay');
    var rulesOverlayContent = document.getElementById('rules-overlay-content');
    var rulesOverlayClose = document.getElementById('rules-overlay-close');
    var rulesSection = document.querySelector('.rules-section');
    function openRulesOverlay() {
      if (rulesOverlay && rulesOverlayContent && rulesSection) {
        rulesOverlayContent.innerHTML = '';
        var guideLink = rulesSection.querySelector('.rules-guide-link');
        if (guideLink) rulesOverlayContent.appendChild(guideLink.cloneNode(true));
        var list = rulesSection.querySelector('.rules-list');
        if (list) {
          var clone = list.cloneNode(true);
          rulesOverlayContent.appendChild(clone);
        }
        var cardsLink = rulesSection.querySelector('.rules-cards-link');
        if (cardsLink) {
          var linkClone = cardsLink.cloneNode(true);
          rulesOverlayContent.appendChild(linkClone);
        }
        rulesOverlay.style.display = 'flex';
      }
    }
    function closeRulesOverlay() {
      if (rulesOverlay) rulesOverlay.style.display = 'none';
    }
    if (rulesOverlay) rulesOverlay.addEventListener('click', function (e) { if (e.target === rulesOverlay) closeRulesOverlay(); });
    if (rulesOverlayClose) rulesOverlayClose.addEventListener('click', closeRulesOverlay);
    var btnRules = document.getElementById('btn-rules');
    if (btnRules) btnRules.addEventListener('click', openRulesOverlay);

    var headerRevealBar = document.getElementById('header-reveal-bar');
    if (headerRevealBar) {
      headerRevealBar.addEventListener('click', function () { document.body.classList.remove('header-hidden'); });
      headerRevealBar.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { document.body.classList.remove('header-hidden'); e.preventDefault(); } });
    }
    var mobileLandscape = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
    function scheduleHeaderAutoHide() {
      if (!mobileLandscape.matches) return;
      setTimeout(function () { document.body.classList.add('header-hidden'); }, 3000);
    }
    scheduleHeaderAutoHide();
    if (mobileLandscape.addEventListener) mobileLandscape.addEventListener('change', function () { if (mobileLandscape.matches) scheduleHeaderAutoHide(); });

    var ovalTable = document.querySelector('.oval-table');
    if (ovalTable) {
      ovalTable.addEventListener('click', function (e) {
        var seat = e.target.closest('.seat-opp[data-player-id]');
        if (!seat || state.isMultiplayer) return;
        var slot = parseInt(seat.getAttribute('data-player-id'), 10);
        if (isNaN(slot) || slot < 1 || slot > 4) return;
        if (!state.revealedOpponents) state.revealedOpponents = { 1: false, 2: false, 3: false, 4: false };
        state.revealedOpponents[slot] = !state.revealedOpponents[slot];
        updateUI();
      });
      ovalTable.addEventListener('touchend', function (e) {
        var seat = e.target.closest('.seat-opp[data-player-id]');
        if (!seat || state.isMultiplayer) return;
        e.preventDefault();
        var slot = parseInt(seat.getAttribute('data-player-id'), 10);
        if (isNaN(slot) || slot < 1 || slot > 4) return;
        if (!state.revealedOpponents) state.revealedOpponents = { 1: false, 2: false, 3: false, 4: false };
        state.revealedOpponents[slot] = !state.revealedOpponents[slot];
        updateUI();
      }, { passive: false });
    }

    var btnBack = document.getElementById('btn-back');
    if (btnBack) btnBack.addEventListener('click', function () {
      if (state.historyIndex <= 0) return;
      state.historyIndex--;
      restoreState(state.history[state.historyIndex]);
      updateUI();
    });
    var btnForward = document.getElementById('btn-forward');
    if (btnForward) btnForward.addEventListener('click', function () {
      if (state.historyIndex >= state.history.length - 1) return;
      state.historyIndex++;
      restoreState(state.history[state.historyIndex]);
      updateUI();
    });

    document.getElementById('btn-draw').addEventListener('click', doHumanDraw);

    document.getElementById('draw-pile').addEventListener('click', function () {
      if (state.currentPlayer !== getLocalPlayerIndex()) return;
      if (state.deck.length === 0) {
        tryShowTutorialRule('deck');
        var el = document.getElementById('message-area');
        if (el) el.textContent = 'Deck is empty — shed any card you want. First to empty your hand wins.';
        updateUI();
        return;
      }
      if (!hasLegalPlay(state.hands[getLocalPlayerIndex()])) doHumanDraw();
    });

    document.getElementById('player-hand').addEventListener('click', function (e) {
      var cardEl = e.target.closest('.card');
      if (!cardEl || state.currentPlayer !== getLocalPlayerIndex()) return;
      var idx = parseInt(cardEl.getAttribute('data-hand-index'), 10);
      if (isNaN(idx)) return;
      var hand = state.hands[getLocalPlayerIndex()];
      var card = hand[idx];
      if (!card) return;

      var plays = getLegalPlays(hand, state.topCard);
      var singlePlay = plays.filter(function (p) { return p.length === 1 && p[0] === card; })[0];
      if (singlePlay) {
        doHumanPlay(singlePlay);
        return;
      }
      var ferro = playFerroComboFromHand(hand);
      if (ferro) {
        showMoleculeRulePopup('Ferromagnetism combo', FERRO_COMBO_USE);
        doHumanPlay(ferro);
        return;
      }
      var moleculePlay = plays.filter(function (p) {
        return p.length > 1 && p.some(function (c) { return c === card; });
      })[0];
      if (moleculePlay) {
        var molName = moleculeNameForPlay(moleculePlay);
        showMoleculeRulePopup(molName || 'Molecule', moleculeUseForName(molName) || 'Stable molecule — play all cards at once.');
        doHumanPlay(moleculePlay);
      }
    });
  }

  function init() {
    setupEventListeners();
    var hasGameId = window.location.search.indexOf('gameId=') !== -1;
    if (hasGameId) {
      state.isMultiplayer = true;
      var newGameBtn = document.getElementById('btn-new-game');
      if (newGameBtn) newGameBtn.style.display = 'none';
      document.getElementById('message-area').textContent = 'Connecting to game…';
      return;
    }
    deal();
    updateUI();
    document.getElementById('message-area').textContent = 'Click a card to play, or Draw if you can\'t. When you see "Batch shed available" above your hand, click a highlighted card to play a molecule or the Ferro combo.';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /** Run single-player until someone wins or maxTurns. Returns { winnerIndex, turns } or { stuck: true, turns } if no winner. */
  function runSinglePlayerSimulation(maxTurns) {
    state.isMultiplayer = false;
    state.myPlayerIndex = 0;
    deal();
    var limit = maxTurns || 50000;
    for (var t = 0; t < limit; t++) {
      if (state.winnerIndex !== undefined && state.winnerIndex >= 0) {
        return { winnerIndex: state.winnerIndex, turns: state.turnNumber };
      }
      var cur = state.currentPlayer;
      var hand = state.hands[cur];
      var result = null;
      if (cur === 0) {
        var plays = getLegalPlays(hand, state.topCard);
        var ferro = playFerroComboFromHand(hand);
        if (ferro) {
          result = playCards(0, ferro);
        } else if (plays.length > 0) {
          result = playCards(0, plays[0]);
        } else {
          if (state.deck.length === 0) {
            if (hand.length === 0) {
              var w = checkWin();
              if (w >= 0) state.winnerIndex = w;
            }
            return state.winnerIndex >= 0 ? { winnerIndex: state.winnerIndex, turns: state.turnNumber } : { stuck: true, turns: state.turnNumber };
          }
          drawOne(0);
        }
      } else {
        var move = getAIMove(cur);
        if (move && move.cards && move.cards.length > 0) {
          result = playCards(cur, move.cards);
        } else {
          if (state.deck.length === 0) {
            if (hand.length === 0) {
              var w = checkWin();
              if (w >= 0) state.winnerIndex = w;
            }
            return state.winnerIndex >= 0 ? { winnerIndex: state.winnerIndex, turns: state.turnNumber } : { stuck: true, turns: state.turnNumber };
          }
          drawOne(cur);
        }
      }
      if (state.winnerIndex !== undefined && state.winnerIndex >= 0) {
        return { winnerIndex: state.winnerIndex, turns: state.turnNumber };
      }
      state.currentPlayer = result && result.ferro ? result.next : nextPlayer();
      state.turnNumber++;
      if (state.currentPlayer === 0) {
        var decayed = decayTick();
        decayed.forEach(function (c) { state.discardPile.push(c); });
      }
      var win = checkWin();
      if (win >= 0) state.winnerIndex = win;
    }
    return { stuck: true, turns: state.turnNumber };
  }

  window.youknObtainium = {
    state: state,
    playCards: playCards,
    checkWin: checkWin,
    explainPlay: explainPlay,
    runSinglePlayerSimulation: runSinglePlayerSimulation,
    getLegalPlays: getLegalPlays,
    hasLegalPlay: hasLegalPlay,
    canPlayFerroCombo: canPlayFerroCombo,
    playFerroComboFromHand: playFerroComboFromHand,
    isElementCard: isElementCard,
    getEffectiveFamily: getEffectiveFamily,
    getStateSnapshot: getStateSnapshot,
    applyStateFromMultiplayer: applyStateFromMultiplayer,
    setMultiplayer: setMultiplayer,
    setOpenCards: setOpenCards,
    setOnStateChange: setOnStateChange,
    deal: deal,
    updateUI: updateUI,
    ELEMENT_LIST: ELEMENT_LIST,
    FAMILY_NAMES: FAMILY_NAMES,
    STABLE_MOLECULES: STABLE_MOLECULES,
    FERROMAGNETIC_SYMS: FERROMAGNETIC_SYMS,
    MELTING_K: MELTING_K,
    METAL_SYMS: METAL_SYMS,
    RADIOACTIVE_SYMS: RADIOACTIVE_SYMS,
    DECAY_TURNS: DECAY_TURNS,
    SPECIAL_CARDS: [FISSION_CARD, FUSION_CARD, EVENT_HORIZON_CARD].concat(TEMPERATURE_CARDS)
  };
})();
