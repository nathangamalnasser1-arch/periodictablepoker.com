import { createDeck, shuffle } from '../data/elements.js';

/** Single-player table: 10 players, 1000 atomcoins each, 10000 total */
export const TOTAL_ATOMCOINS = 10000;
export const PER_PLAYER_ATOMCOINS = 1000;
export const NUM_TABLE_PLAYERS = 10;
export const ANTE_PER_HAND = 50;

/** Texas Hold'em phases */
export const PHASES = {
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
};

/** Create a new session: 10 players (index 0 = human), 1000 atomcoins each. */
export function createSession(guestName, gameName) {
  const players = [];
  for (let i = 0; i < NUM_TABLE_PLAYERS; i++) {
    players.push({
      id: `player-${i}`,
      seatIndex: i,
      name: i === 0 ? (guestName || 'You') : `Bot ${i}`,
      holeCards: [],
      chips: PER_PLAYER_ATOMCOINS,
      bet: 0,
      folded: false,
      isBot: i !== 0,
      eliminated: false,
    });
  }
  return {
    players,
    handNumber: 0,
    startTime: Date.now(),
    guestName: guestName || 'guest',
    gameName: gameName || 'game',
    stats: {
      bestHand: null,
      lastHand: null,
      biggestWin: 0,
    },
    currentHand: null,
  };
}

/** Deal a new hand: ante from each active player, deal 2 cards each. */
export function dealHand(session) {
  const deck = shuffle(createDeck());
  const activePlayers = session.players.filter((p) => !p.eliminated && p.chips > 0);
  if (activePlayers.length < 2) return session;
  const ante = Math.min(ANTE_PER_HAND, ...activePlayers.map((p) => p.chips));
  let deckIndex = 0;
  const players = session.players.map((p) => {
    if (p.eliminated || p.chips <= 0) return { ...p, holeCards: [], folded: true, bet: 0 };
    const take = Math.min(ante, p.chips);
    const holeCards = [deck[deckIndex++], deck[deckIndex++]];
    return {
      ...p,
      holeCards,
      chips: p.chips - take,
      bet: take,
      folded: false,
    };
  });
  const pot = ante * activePlayers.length;
  return {
    ...session,
    players,
    handNumber: session.handNumber + 1,
    currentHand: {
      deck,
      deckIndex,
      communityCards: [],
      phase: PHASES.PREFLOP,
      pot,
    },
  };
}

/** Apply flop to session's current hand */
export function dealFlopSession(session) {
  const { currentHand } = session;
  if (!currentHand || currentHand.phase !== PHASES.PREFLOP) return session;
  const { deck, deckIndex } = currentHand;
  const newCommunity = [deck[deckIndex], deck[deckIndex + 1], deck[deckIndex + 2]];
  return {
    ...session,
    currentHand: {
      ...currentHand,
      communityCards: newCommunity,
      deckIndex: deckIndex + 3,
      phase: PHASES.FLOP,
    },
  };
}

/** Apply turn to session's current hand */
export function dealTurnSession(session) {
  const { currentHand } = session;
  if (!currentHand || currentHand.phase !== PHASES.FLOP) return session;
  const { deck, deckIndex } = currentHand;
  return {
    ...session,
    currentHand: {
      ...currentHand,
      communityCards: [...currentHand.communityCards, deck[deckIndex]],
      deckIndex: deckIndex + 1,
      phase: PHASES.TURN,
    },
  };
}

/** Apply river to session's current hand */
export function dealRiverSession(session) {
  const { currentHand } = session;
  if (!currentHand || currentHand.phase !== PHASES.TURN) return session;
  const { deck, deckIndex } = currentHand;
  return {
    ...session,
    currentHand: {
      ...currentHand,
      communityCards: [...currentHand.communityCards, deck[deckIndex]],
      deckIndex: deckIndex + 1,
      phase: PHASES.RIVER,
    },
  };
}

/** Compare hand ranks: CHONP > H₂O > NaCl > weight. Returns true if a beats b. */
function handRankBeats(a, b) {
  if (a.tier !== b.tier) return a.tier > b.tier;
  return a.weight > b.weight;
}

/** Find winner(s) by hand rank (CHONP > H₂O > NaCl > atomic weight). Returns { session, gameOver, winner, winAmount }. */
export function endHand(session) {
  const { currentHand, players, stats } = session;
  if (!currentHand || currentHand.phase !== PHASES.RIVER) return { session, gameOver: false };
  const communityCards = currentHand.communityCards;
  const inHand = players.filter((p) => !p.folded && !p.eliminated);
  const ranked = inHand.map((p) => ({ player: p, rank: getHandRank(p.holeCards, communityCards) }));
  let best = ranked[0];
  ranked.forEach((r) => {
    if (handRankBeats(r.rank, best.rank)) best = r;
  });
  const winners = ranked.filter((r) => !handRankBeats(best.rank, r.rank) && !handRankBeats(r.rank, best.rank)).map((r) => r.player);
  const winAmount = currentHand.pot;
  const winnerIds = new Set(winners.map((w) => w.id));
  const updatedPlayers = players.map((p) => {
    if (p.eliminated) return p;
    const won = winnerIds.has(p.id);
    const newChips = p.chips + (won ? winAmount : 0);
    const eliminated = newChips <= 0;
    const lastHandResult = getHandRank(p.holeCards, communityCards);
    return {
      ...p,
      chips: newChips,
      eliminated: eliminated || p.eliminated,
      lastHandResult,
    };
  });
  const humanPlayer = updatedPlayers.find((p) => p.id === 'player-0');
  const humanWon = winnerIds.has('player-0');
  const prevBest = stats.bestHand;
  const newBestHand =
    humanPlayer?.lastHandResult &&
    (humanPlayer.lastHandResult.tier > (prevBest?.tier ?? 0) ||
      (humanPlayer.lastHandResult.tier === (prevBest?.tier ?? 0) && humanPlayer.lastHandResult.weight > (prevBest?.weight ?? 0)))
      ? humanPlayer.lastHandResult
      : prevBest;
  const newLastHand = humanPlayer?.lastHandResult ?? stats.lastHand;
  const newBiggestWin = humanWon
    ? Math.max(stats.biggestWin, winAmount)
    : stats.biggestWin;
  const newSession = {
    ...session,
    players: updatedPlayers,
    currentHand: { ...currentHand, phase: PHASES.SHOWDOWN },
    stats: {
      bestHand: newBestHand,
      lastHand: newLastHand,
      biggestWin: newBiggestWin,
    },
  };
  const hasAllCoins = updatedPlayers.some((p) => p.chips >= TOTAL_ATOMCOINS);
  const remaining = updatedPlayers.filter((p) => p.chips > 0);
  const gameOver = hasAllCoins || remaining.length <= 1;
  const gameWinner = hasAllCoins
    ? updatedPlayers.find((p) => p.chips >= TOTAL_ATOMCOINS)
    : remaining.length === 1
      ? remaining[0]
      : null;
  return {
    session: newSession,
    gameOver,
    winner: gameWinner || (winners.length === 1 ? updatedPlayers.find((p) => p.id === winners[0].id) : null),
    winAmount,
  };
}

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
export function dealGame(numPlayers = 2, gameNumber = 0) {
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

/** Win order: CHONP (best) > H₂O > NaCl > else max atomic weight. Tier 4=CHONP, 3=H₂O, 2=NaCl, 1=weight only. */
export const HAND_TIERS = { CHONP: 4, H2O: 3, NACL: 2, WEIGHT: 1 };

/** Returns { tier, combo, weight, cards } for ranking hands. Higher tier wins; same tier uses weight. */
export function getHandRank(holeCards, communityCards) {
  const combo = getMoleculeCombo(holeCards, communityCards);
  const { cards, weight } = getBestHand(holeCards, communityCards);
  const w = Math.round((weight || 0) * 100) / 100;
  if (combo === 'chonp') return { tier: HAND_TIERS.CHONP, combo: 'chonp', weight: w, cards };
  if (combo === 'h2o') return { tier: HAND_TIERS.H2O, combo: 'h2o', weight: w, cards };
  if (combo === 'nacl') return { tier: HAND_TIERS.NACL, combo: 'nacl', weight: w, cards };
  return { tier: HAND_TIERS.WEIGHT, combo: null, weight: w, cards };
}

/** Returns { cards, weight } for best 5-card hand by total atomic mass (and tier/combo via getHandRank) */
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
