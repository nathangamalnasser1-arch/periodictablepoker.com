import { createDeck, shuffle } from '../data/elements.js';

/** Texas Hold'em phases */
export const PHASES = {
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
};

/** Build deck for intro games 1–3 with guaranteed molecule cards in first 9 positions */
function buildIntroDeck(gameNumber) {
  const full = createDeck();
  const bySymbol = (s) => full.find((c) => c.symbol === s);

  let required = [];
  let positions = [];

  if (gameNumber === 1) {
    const h = bySymbol('H');
    const o = bySymbol('O');
    required = [h, o];
    positions = [0, 4];
  } else if (gameNumber === 2) {
    const na = bySymbol('Na');
    const cl = bySymbol('Cl');
    required = [na, cl];
    positions = [0, 4];
  } else if (gameNumber === 3) {
    required = ['C', 'H', 'O', 'N', 'P'].map((s) => bySymbol(s));
    positions = [2, 3, 4, 5, 6];
  }

  const usedSymbols = new Set(required.map((c) => c?.symbol).filter(Boolean));
  const remaining = full.filter((c) => !usedSymbols.has(c.symbol));
  const shuffled = shuffle(remaining);

  const deck = new Array(Math.max(9, full.length));
  let shufIdx = 0;
  for (let i = 0; i < 9; i++) {
    if (positions.includes(i)) {
      deck[i] = required[positions.indexOf(i)];
    } else {
      deck[i] = shuffled[shufIdx++];
    }
  }
  for (let i = 9; i < deck.length; i++) {
    deck[i] = shuffled[shufIdx++] ?? shuffled[0];
  }
  return deck;
}

/** Deal hole cards (2 per player) and community cards. gameNumber 1–3 = intro hands. */
export function dealGame(numPlayers = 10, gameNumber = 0) {
  const deck =
    gameNumber >= 1 && gameNumber <= 3
      ? buildIntroDeck(gameNumber)
      : shuffle(createDeck());
  const players = [];
  let idx = 0;

  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: `player-${i}`,
      holeCards: [deck[idx++], deck[idx++]],
      chips: 1000,
      bet: 0,
      folded: false,
    });
  }

  const communityCards = [];
  return { deck, players, communityCards, phase: PHASES.PREFLOP, pot: 0, deckIndex: idx };
}

/** Reveal flop (3 cards) */
export function dealFlop(gameState) {
  const { deck, deckIndex } = gameState;
  const newCommunity = [
    deck[deckIndex],
    deck[deckIndex + 1],
    deck[deckIndex + 2],
  ];
  return {
    ...gameState,
    communityCards: newCommunity,
    deckIndex: deckIndex + 3,
    phase: PHASES.FLOP,
  };
}

/** Reveal turn (1 card) */
export function dealTurn(gameState) {
  const { deck, deckIndex } = gameState;
  return {
    ...gameState,
    communityCards: [...gameState.communityCards, deck[deckIndex]],
    deckIndex: deckIndex + 1,
    phase: PHASES.TURN,
  };
}

/** Reveal river (1 card) */
export function dealRiver(gameState) {
  const { deck, deckIndex } = gameState;
  return {
    ...gameState,
    communityCards: [...gameState.communityCards, deck[deckIndex]],
    deckIndex: deckIndex + 1,
    phase: PHASES.RIVER,
  };
}

/** Get weight of a card (atomic mass) */
function cardWeight(card) {
  return card?.mass ?? (card?.number ?? 0) * 2;
}

/** Generate all k-combinations from array */
function combinations(arr, k) {
  if (k > arr.length || k <= 0) return [];
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map((x) => [x]);

  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const rest = combinations(arr.slice(i + 1), k - 1);
    rest.forEach((combo) => result.push([arr[i], ...combo]));
  }
  return result;
}

/** Sum of best 5-card hand by total atomic mass (highest weight wins) */
export function getBestHandWeight(holeCards, communityCards) {
  const { weight } = getBestHand(holeCards, communityCards);
  return weight;
}

/** Count symbols in cards. Returns { H: 2, O: 1, ... } */
function countSymbols(cards) {
  const counts = {};
  (cards || []).forEach((c) => {
    const s = c?.symbol;
    if (s) counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

/** Detect special molecule combo: 'h2o' | 'nacl' | 'chonp' | null (1 card per element) */
export function getMoleculeCombo(holeCards, communityCards) {
  const all = [...(holeCards || []), ...(communityCards || [])];
  const c = countSymbols(all);
  if ((c['C'] || 0) >= 1 && (c['H'] || 0) >= 1 && (c['O'] || 0) >= 1 && (c['N'] || 0) >= 1 && (c['P'] || 0) >= 1) return 'chonp';
  if ((c['H'] || 0) >= 1 && (c['O'] || 0) >= 1) return 'h2o';
  if ((c['Na'] || 0) >= 1 && (c['Cl'] || 0) >= 1) return 'nacl';
  return null;
}

/** Returns { cards, weight } for best 5-card hand by total atomic mass */
export function getBestHand(holeCards, communityCards) {
  const allCards = [...(holeCards || []), ...(communityCards || [])];
  if (allCards.length === 0) return { cards: [], weight: 0 };
  if (allCards.length <= 5) {
    const cards = [...allCards];
    const weight = Math.round(cards.reduce((s, c) => s + cardWeight(c), 0) * 100) / 100;
    return { cards, weight };
  }
  const combos = combinations(allCards, 5);
  let best = { cards: combos[0], weight: 0 };
  combos.forEach((combo) => {
    const sum = combo.reduce((s, c) => s + cardWeight(c), 0);
    if (sum > best.weight) best = { cards: combo, weight: sum };
  });
  return { ...best, weight: Math.round(best.weight * 100) / 100 };
}
