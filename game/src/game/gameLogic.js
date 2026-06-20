import { createDeck, shuffle } from '../data/elements.js';
import { matchMoleculeCombo, getKnownMolecule, MASS_TIER } from '../data/knownMolecules.js';
import { getCatalogMoleculeByIndex, MOLECULE_CATALOG_COUNT } from '../data/moleculeCatalog.js';
import { buildMoleculeTestDeck } from './moleculeTestDeck.js';

/** Texas Hold'em phases */
export const PHASES = {
  PREFLOP: 'preflop',
  FLOP: 'flop',
  TURN: 'turn',
  RIVER: 'river',
  SHOWDOWN: 'showdown',
};

/** Betting */
export const SB = 5;
export const BB = 10;
export const STARTING_CHIPS = 1000;
const BOT_STYLES = ['aggressive', 'defensive', 'random'];
/** Hand strength (best 5-card mass) above this: bot never folds. */
const STRONG_HAND_MASS = 200;

/**
 * Build deck for intro games 1–3 so one random player gets the winning molecule and wins.
 * Game 1: one player gets NaCl (hole cards) and wins.
 * Game 2: one player gets H₂O (hole cards) and wins.
 * Game 3: one player gets CHONP (hole cards C,H + flop O,N,P) and wins.
 * @param {number} gameNumber - 1, 2, or 3
 * @param {number} numPlayers
 * @param {number} [winnerOverride] - optional fixed winner index for tests
 */
function buildIntroDeck(gameNumber, numPlayers, winnerOverride) {
  const full = createDeck();
  const bySymbol = (s) => full.find((c) => c.symbol === s);
  const winner =
    winnerOverride !== undefined
      ? winnerOverride
      : Math.floor(Math.random() * numPlayers);

  const usedSymbols = new Set();
  const deck = [...full];
  shuffle(deck);

  if (gameNumber === 1) {
    const na = bySymbol('Na');
    const cl = bySymbol('Cl');
    usedSymbols.add('Na').add('Cl');
    const pos0 = winner * 2;
    const pos1 = winner * 2 + 1;
    deck[pos0] = na;
    deck[pos1] = cl;
    const remaining = deck.filter((c, i) => !usedSymbols.has(c?.symbol) && i !== pos0 && i !== pos1);
    shuffle(remaining);
    let r = 0;
    for (let i = 0; i < deck.length; i++) {
      if (i !== pos0 && i !== pos1) deck[i] = remaining[r++ % remaining.length];
    }
  } else if (gameNumber === 2) {
    const h = bySymbol('H');
    const o = bySymbol('O');
    usedSymbols.add('H').add('O');
    const pos0 = winner * 2;
    const pos1 = winner * 2 + 1;
    deck[pos0] = h;
    deck[pos1] = o;
    const remaining = deck.filter((c, i) => !usedSymbols.has(c?.symbol) && i !== pos0 && i !== pos1);
    shuffle(remaining);
    let r = 0;
    for (let i = 0; i < deck.length; i++) {
      if (i !== pos0 && i !== pos1) deck[i] = remaining[r++ % remaining.length];
    }
  } else if (gameNumber === 3) {
    const [c, h, o, n, p] = ['C', 'H', 'O', 'N', 'P'].map((s) => bySymbol(s));
    usedSymbols.add('C').add('H').add('O').add('N').add('P');
    const hole0 = winner * 2;
    const hole1 = winner * 2 + 1;
    const flop0 = numPlayers * 2;
    const flop1 = numPlayers * 2 + 1;
    const flop2 = numPlayers * 2 + 2;
    deck[hole0] = c;
    deck[hole1] = h;
    deck[flop0] = o;
    deck[flop1] = n;
    deck[flop2] = p;
    const remaining = deck.filter(
      (c, i) => !usedSymbols.has(c?.symbol) && ![hole0, hole1, flop0, flop1, flop2].includes(i)
    );
    shuffle(remaining);
    let r = 0;
    for (let i = 0; i < deck.length; i++) {
      if (![hole0, hole1, flop0, flop1, flop2].includes(i)) deck[i] = remaining[r++ % remaining.length];
    }
  }

  return deck;
}

function seatLayout(numPlayers, dealerIndex) {
  if (numPlayers === 2) {
    const sbIndex = dealerIndex;
    const bbIndex = (dealerIndex + 1) % 2;
    return { sbIndex, bbIndex, firstToAct: sbIndex };
  }
  const sbIndex = (dealerIndex + 1) % numPlayers;
  const bbIndex = (dealerIndex + 2) % numPlayers;
  const firstToAct = (dealerIndex + 3) % numPlayers;
  return { sbIndex, bbIndex, firstToAct };
}

/** Deal hole cards (2 per player) and community cards. gameNumber 1–3 = intro (NaCl, H₂O, CHONP). Game 4 = real game start (1000 chips). Game 5+ = persist previousChips. */
export function dealGame(numPlayers = 10, gameNumber = 0, winnerOverride = undefined, sessionState = null, previousChips = null, tutorial = false) {
  const tutorialMode = sessionState?.tutorial ?? !!tutorial;
  const deck =
    gameNumber >= 1 && gameNumber <= 3
      ? buildIntroDeck(gameNumber, numPlayers, winnerOverride)
      : shuffle(createDeck());
  const players = [];
  let idx = 0;

  const useChips = (gameNumber >= 4 && Array.isArray(previousChips) && previousChips.length === numPlayers)
    ? previousChips
    : null;
  const baseChips = (i) => (useChips != null ? useChips[i] : STARTING_CHIPS);

  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: `player-${i}`,
      holeCards: [deck[idx++], deck[idx++]],
      chips: baseChips(i),
      bet: 0,
      folded: false,
    });
  }

  const communityCards = [];
  const dealerIndex = (gameNumber - 1 + numPlayers) % numPlayers;
  const { sbIndex, bbIndex, firstToAct } = seatLayout(numPlayers, dealerIndex);
  const roundBets = new Array(numPlayers).fill(0);
  const totalBetThisHand = new Array(numPlayers).fill(0);

  players[sbIndex].chips -= SB;
  players[bbIndex].chips -= BB;
  roundBets[sbIndex] = SB;
  roundBets[bbIndex] = BB;
  totalBetThisHand[sbIndex] = SB;
  totalBetThisHand[bbIndex] = BB;

  const pot = SB + BB;
  const currentBet = BB;
  const hasActedThisRound = new Array(numPlayers).fill(false);

  const session = sessionState || {
    gameStartTime: Date.now(),
    sessionBestHand: 0,
    sessionBiggestPot: 0,
  };

  const botStyles = session.botStyles || Array.from({ length: numPlayers }, (_, i) =>
    BOT_STYLES[Math.floor(Math.random() * BOT_STYLES.length)]
  );
  if (!session.botStyles) session.botStyles = botStyles;
  session.tutorial = tutorialMode;

  const pots = buildSidePots(totalBetThisHand, players.map((p) => p.folded));

  return {
    deck,
    players,
    communityCards,
    phase: PHASES.PREFLOP,
    pot,
    pots,
    deckIndex: idx,
    gameNumber,
    dealerIndex,
    roundBets,
    totalBetThisHand,
    currentBet,
    lastRaiseSize: BB,
    currentPlayerIndex: firstToAct,
    bettingRound: PHASES.PREFLOP,
    hasActedThisRound,
    lastAction: null,
    tutorial: tutorialMode,
    ...session,
  };
}

/**
 * Deal a molecule-test hand: stacked deck guarantees player 0 has catalog molecule after flop.
 * @param {number} catalogIndex - 1..50
 */
export function dealMoleculeTestGame({ catalogIndex, numPlayers = 5, winnerIndex = 0 }) {
  const mol = getCatalogMoleculeByIndex(catalogIndex);
  if (!mol) throw new Error(`Invalid molecule test index: ${catalogIndex}`);

  const deck = buildMoleculeTestDeck({
    moleculeId: mol.id,
    numPlayers,
    winnerIndex,
  });
  const players = [];
  let idx = 0;

  for (let i = 0; i < numPlayers; i++) {
    players.push({
      id: `player-${i}`,
      holeCards: [deck[idx++], deck[idx++]],
      chips: STARTING_CHIPS,
      bet: 0,
      folded: false,
    });
  }

  const communityCards = [];
  const dealerIndex = (catalogIndex - 1 + numPlayers) % numPlayers;
  const { sbIndex, bbIndex, firstToAct } = seatLayout(numPlayers, dealerIndex);
  const roundBets = new Array(numPlayers).fill(0);
  const totalBetThisHand = new Array(numPlayers).fill(0);

  players[sbIndex].chips -= SB;
  players[bbIndex].chips -= BB;
  roundBets[sbIndex] = SB;
  roundBets[bbIndex] = BB;
  totalBetThisHand[sbIndex] = SB;
  totalBetThisHand[bbIndex] = BB;

  const pot = SB + BB;
  const currentBet = BB;
  const hasActedThisRound = new Array(numPlayers).fill(false);
  const botStyles = Array.from({ length: numPlayers }, (_, i) =>
    BOT_STYLES[i % BOT_STYLES.length],
  );
  const pots = buildSidePots(totalBetThisHand, players.map((p) => p.folded));

  return {
    deck,
    players,
    communityCards,
    phase: PHASES.PREFLOP,
    pot,
    pots,
    deckIndex: idx,
    gameNumber: catalogIndex,
    dealerIndex,
    roundBets,
    totalBetThisHand,
    currentBet,
    lastRaiseSize: BB,
    currentPlayerIndex: firstToAct,
    bettingRound: PHASES.PREFLOP,
    hasActedThisRound,
    lastAction: null,
    tutorial: true,
    moleculeTest: true,
    moleculeTestIndex: catalogIndex,
    moleculeTestId: mol.id,
    moleculeTestComplete: false,
    gameStartTime: Date.now(),
    sessionBestHand: 0,
    sessionBiggestPot: 0,
    botStyles,
  };
}

/** Fast-forward a molecule-test hand to showdown (unit tests). Bots fold; human checks/calls. */
export function runMoleculeTestHandToShowdown(state, humanIndex = 0) {
  let s = { ...state, players: state.players.map((p) => ({ ...p })) };
  let guard = 0;
  while (s.phase !== PHASES.SHOWDOWN && guard < 200) {
    guard += 1;
    const idx = s.currentPlayerIndex;
    const p = s.players[idx];
    if (!p || p.folded) {
      s = advanceIfCurrentPlayerInvalid(s, s.gameNumber) ?? s;
      continue;
    }
    if (idx === humanIndex) {
      const toCall = s.currentBet - (s.roundBets[idx] || 0);
      s = playerAction(s, idx, toCall > 0 ? 'call' : 'check');
    } else {
      s = playerAction(s, idx, 'fold');
    }
    if (isBettingRoundComplete(s)) {
      s = advanceBettingRound(s, s.gameNumber);
    }
    s = autoAdvanceIdlePlayers(s, s.gameNumber);
  }
  return s;
}

export { MOLECULE_CATALOG_COUNT };

/** Build main + side pots from per-player total contributions. */
export function buildSidePots(totalBetThisHand, folded) {
  const n = totalBetThisHand.length;
  const rem = [...totalBetThisHand];
  const pots = [];
  let level = 0;
  while (rem.some((x) => x > 0)) {
    const min = Math.min(...rem.filter((x) => x > 0));
    let amount = 0;
    for (let i = 0; i < n; i++) {
      if (rem[i] > 0) {
        amount += min;
        rem[i] -= min;
      }
    }
    const eligible = [];
    for (let i = 0; i < n; i++) {
      if (!folded[i] && totalBetThisHand[i] >= level + min) {
        eligible.push(i);
      }
    }
    if (amount > 0 && eligible.length > 0) {
      pots.push({ amount, eligible });
    }
    level += min;
  }
  return pots;
}

export function getMinOpenBet() {
  return BB;
}

export function getMinRaiseTo(state) {
  const { currentBet, lastRaiseSize } = state;
  if (currentBet <= 0) return BB;
  return currentBet + (lastRaiseSize || BB);
}

function addToPot(next, playerIndex, chips) {
  next.pot = (next.pot || 0) + chips;
  next.totalBetThisHand[playerIndex] = (next.totalBetThisHand[playerIndex] || 0) + chips;
  next.pots = buildSidePots(next.totalBetThisHand, next.players.map((p) => p.folded));
}

/** Burn one card before community cards on real games (game 4+), not intro or molecule tests. */
function communityBurn(gameState) {
  if (gameState?.moleculeTest) return 0;
  return (gameState?.gameNumber ?? 0) >= 4 ? 1 : 0;
}

/** Reveal flop (3 cards) after burn on real games (game 4+) */
export function dealFlop(gameState) {
  const { deck, deckIndex } = gameState;
  const burn = communityBurn(gameState);
  const start = deckIndex + burn;
  const newCommunity = [deck[start], deck[start + 1], deck[start + 2]];
  return {
    ...gameState,
    communityCards: newCommunity,
    deckIndex: start + 3,
    phase: PHASES.FLOP,
  };
}

/** Reveal turn (1 card) after burn on real games */
export function dealTurn(gameState) {
  const { deck, deckIndex } = gameState;
  const burn = communityBurn(gameState);
  const start = deckIndex + burn;
  return {
    ...gameState,
    communityCards: [...gameState.communityCards, deck[start]],
    deckIndex: start + 1,
    phase: PHASES.TURN,
  };
}

/** Reveal river (1 card) after burn on real games */
export function dealRiver(gameState) {
  const { deck, deckIndex } = gameState;
  const burn = communityBurn(gameState);
  const start = deckIndex + burn;
  return {
    ...gameState,
    communityCards: [...gameState.communityCards, deck[start]],
    deckIndex: start + 1,
    phase: PHASES.RIVER,
  };
}

/** Whether this player can act (not folded, has chips — not all-in). */
function canAct(state, playerIndex) {
  const p = state.players[playerIndex];
  return p && !p.folded && p.chips > 0;
}

function getNextActivePlayerIndex(state, fromIndex) {
  const { players } = state;
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (canAct(state, idx)) return idx;
  }
  return fromIndex;
}

export function advanceIfCurrentPlayerInvalid(state, gameNumber) {
  const { players, currentPlayerIndex } = state;
  if (currentPlayerIndex == null || !players?.length) return null;
  if (state.phase === PHASES.SHOWDOWN) return null;
  const current = players[currentPlayerIndex];
  const cannotAct = !current || current.folded || current.chips <= 0;
  if (cannotAct) {
    if (isBettingRoundComplete(state)) return advanceBettingRound(state, gameNumber);
    const nextIdx = getNextActivePlayerIndex(state, currentPlayerIndex);
    if (nextIdx === currentPlayerIndex) return advanceBettingRound(state, gameNumber);
    const next = { ...state, currentPlayerIndex: nextIdx };
    if (!current.folded && current.chips <= 0) {
      next.lastAction = { playerIndex: currentPlayerIndex, action: 'all-in' };
    }
    return next;
  }
  return null;
}

/** True when exactly one non-folded player still has chips and all others are all-in. */
export function isRunOutLocked(state) {
  const active = state.players.filter((p) => !p.folded);
  if (active.length < 2) return false;
  return active.filter((p) => p.chips > 0).length === 1;
}

/** After the sole remaining bettor checks/calls, deal through to showdown without further streets. */
export function runOutBoardWhenLocked(state, gameNumber) {
  if (state.phase === PHASES.SHOWDOWN || !isRunOutLocked(state)) return state;
  if (!isBettingRoundComplete(state)) return state;
  let s = state;
  while (s.phase !== PHASES.SHOWDOWN && isRunOutLocked(s)) {
    s = advanceBettingRound(s, gameNumber);
  }
  return s;
}

/** Skip all-in / folded seats and deal remaining streets until someone can act or showdown. */
export function autoAdvanceIdlePlayers(state, gameNumber, maxSteps = 8) {
  let s = state;
  for (let i = 0; i < maxSteps; i++) {
    if (s.phase === PHASES.SHOWDOWN) return s;
    const advanced = advanceIfCurrentPlayerInvalid(s, gameNumber);
    if (!advanced) break;
    s = advanced;
  }
  return runOutBoardWhenLocked(s, gameNumber);
}

export function isBettingRoundComplete(state) {
  const { players, roundBets, currentBet, hasActedThisRound } = state;
  const n = players.length;
  let countActive = 0;
  let allMatched = true;
  let allActed = true;
  for (let i = 0; i < n; i++) {
    if (players[i].folded) continue;
    countActive++;
    const matched = roundBets[i] === currentBet || players[i].chips <= 0;
    if (!matched) allMatched = false;
    if (canAct(state, i) && !hasActedThisRound?.[i]) allActed = false;
  }
  if (countActive <= 1) return true;
  return allMatched && allActed;
}

function countActivePlayers(state) {
  return state.players.filter((p) => !p.folded).length;
}

/** Apply one player action. action: 'fold'|'check'|'call'|'bet'|'raise' */
export function playerAction(state, playerIndex, action, amount = 0) {
  const { players, roundBets, currentBet, currentPlayerIndex, lastRaiseSize } = state;
  if (currentPlayerIndex !== playerIndex || players[playerIndex].folded) return state;

  const toCall = currentBet - (roundBets[playerIndex] || 0);
  let next = {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    roundBets: [...state.roundBets],
    totalBetThisHand: [...(state.totalBetThisHand || state.players.map(() => 0))],
    hasActedThisRound: [...(state.hasActedThisRound ?? state.players.map(() => false))],
  };

  if (action === 'fold') {
    next.players[playerIndex].folded = true;
    next.lastAction = { playerIndex, action: 'fold' };
    next.hasActedThisRound[playerIndex] = true;
    next.pots = buildSidePots(next.totalBetThisHand, next.players.map((p) => p.folded));
  } else if (action === 'check') {
    if (toCall > 0) return state;
    next.lastAction = { playerIndex, action: 'check' };
    next.hasActedThisRound[playerIndex] = true;
  } else if (action === 'call') {
    const chips = Math.min(players[playerIndex].chips, toCall);
    next.players[playerIndex].chips -= chips;
    next.roundBets[playerIndex] = (next.roundBets[playerIndex] || 0) + chips;
    addToPot(next, playerIndex, chips);
    next.lastAction = { playerIndex, action: 'call', amount: chips };
    next.hasActedThisRound[playerIndex] = true;
  } else if (action === 'bet' || action === 'raise') {
    const minRaiseTo = getMinRaiseTo(state);
    const minOpen = getMinOpenBet();
    const targetTotal = amount > 0 ? amount : (action === 'bet' ? minOpen : minRaiseTo);
    const maxTotal = (roundBets[playerIndex] || 0) + players[playerIndex].chips;
    let newRoundBet = Math.min(targetTotal, maxTotal);
    if (action === 'bet' && currentBet > 0) return state;
    if (action === 'raise' && toCall <= 0) return state;

    const isAllIn = newRoundBet >= maxTotal;
    const legalMin = action === 'bet' ? minOpen : minRaiseTo;
    if (!isAllIn && newRoundBet < legalMin) return state;

    const chips = newRoundBet - (roundBets[playerIndex] || 0);
    if (chips <= 0) return state;

    next.players[playerIndex].chips -= chips;
    next.roundBets[playerIndex] = newRoundBet;
    addToPot(next, playerIndex, chips);
    const raiseIncrement = newRoundBet - currentBet;
    if (raiseIncrement >= (lastRaiseSize || BB) || isAllIn) {
      next.lastRaiseSize = Math.max(raiseIncrement, lastRaiseSize || BB);
    }
    next.currentBet = newRoundBet;
    next.lastAction = { playerIndex, action, amount: chips };
    next.hasActedThisRound = next.players.map(() => false);
    next.hasActedThisRound[playerIndex] = true;
  }

  const activeCount = countActivePlayers(next);
  if (activeCount <= 1) return next;

  next.currentPlayerIndex = getNextActivePlayerIndex(next, playerIndex);
  return next;
}

function hasCHInHole(holeCards) {
  const symbols = new Set((holeCards || []).map((c) => c.symbol));
  return symbols.has('C') && symbols.has('H');
}

export function botAction(state, playerIndex) {
  const { players, roundBets, currentBet, communityCards, botStyles, phase, tutorial, gameNumber, pot = 0, lastRaiseSize } = state;
  const style = botStyles?.[playerIndex] || 'random';
  const toCall = currentBet - (roundBets[playerIndex] || 0);
  const chips = players[playerIndex].chips;
  const holeCards = players[playerIndex].holeCards;
  const r = Math.random();
  const isPreflop = phase === PHASES.PREFLOP;
  const isCHInHolePreflop = isPreflop && hasCHInHole(holeCards);
  const isTutorialNoFold = tutorial && gameNumber >= 1 && gameNumber <= 3;
  const minRaiseTo = getMinRaiseTo(state);

  if (chips <= 0) return { action: 'fold' };

  const combo = getMoleculeCombo(holeCards, communityCards);
  const hasWinningMolecule = combo === 'chonp' || combo === 'h2o' || combo === 'nacl';
  if (hasWinningMolecule) {
    if (toCall <= 0) return { action: 'bet', amount: chips };
    return { action: 'raise', amount: (roundBets[playerIndex] || 0) + chips };
  }

  const handMass = getBestHandWeight(holeCards, communityCards);
  const strongHand = handMass >= STRONG_HAND_MASS;
  const goodPotOdds = toCall > 0 && pot >= 2 * toCall && chips >= toCall;

  const wouldFold = () => {
    if (strongHand || isTutorialNoFold || isCHInHolePreflop) return false;
    if (goodPotOdds) return false;
    return true;
  };

  if (toCall <= 0) {
    const betAmt = Math.min(chips, BB + Math.floor(Math.random() * 20));
    if (strongHand && r < 0.7) return { action: 'bet', amount: Math.min(chips, BB + Math.floor(handMass / 20)) };
    if (style === 'aggressive' && r < 0.6) return { action: 'bet', amount: betAmt };
    if (style === 'defensive' && r < 0.9) return { action: 'check' };
    if (style === 'random' && r < 0.5) return { action: 'bet', amount: BB };
    return { action: 'check' };
  }

  if (style === 'aggressive') {
    if (wouldFold() && r < 0.3) return { action: 'fold' };
    if (strongHand || r < 0.6) return { action: 'raise', amount: minRaiseTo + Math.floor(Math.random() * 40) };
    return { action: 'call' };
  }
  if (style === 'defensive') {
    if (wouldFold() && toCall > chips * 0.3 && r < 0.5) return { action: 'fold' };
    if (goodPotOdds && r < 0.8) return { action: 'call' };
    if (strongHand && r < 0.3) return { action: 'raise', amount: minRaiseTo };
    return { action: 'call' };
  }
  if (wouldFold() && r < 0.25) return { action: 'fold' };
  if (goodPotOdds || r < 0.6) return { action: 'call' };
  return { action: 'raise', amount: minRaiseTo + Math.floor(Math.random() * 20) };
}

function awardAllPots(next, gameNumber) {
  const pots = buildSidePots(next.totalBetThisHand, next.players.map((p) => p.folded));
  let biggestPot = 0;
  const allWinners = new Set();
  let primaryWinner = 0;
  let primaryReason = 'mass';

  for (const potLayer of pots) {
    const subState = {
      players: next.players.map((p, i) => ({
        ...p,
        folded: p.folded || !potLayer.eligible.includes(i),
      })),
      communityCards: next.communityCards,
    };
    const { winnerIndices, reason } = getWinner(subState, gameNumber);
    const share = Math.floor(potLayer.amount / winnerIndices.length);
    const remainder = potLayer.amount - share * winnerIndices.length;
    winnerIndices.forEach((idx, i) => {
      next.players[idx].chips += share + (i < remainder ? 1 : 0);
    });
    biggestPot = Math.max(biggestPot, potLayer.amount);
    winnerIndices.forEach((i) => allWinners.add(i));
    primaryWinner = winnerIndices[0];
    primaryReason = reason;
  }

  const winnerIndices = [...allWinners];
  if (winnerIndices.includes(0)) {
    const humanBest = getBestHandWeight(next.players[0].holeCards, next.communityCards);
    next.sessionBestHand = Math.max(next.sessionBestHand || 0, humanBest);
    next.sessionBiggestPot = Math.max(next.sessionBiggestPot || 0, biggestPot);
  }

  next.pot = 0;
  next.pots = [];
  next.winnerIndex = primaryWinner;
  next.winnerIndices = winnerIndices.length ? winnerIndices : [primaryWinner];
  next.winnerReason = primaryReason;
  return next;
}

export function advanceBettingRound(state, gameNumber) {
  let next = {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    roundBets: state.players.map(() => 0),
    currentBet: 0,
    lastRaiseSize: BB,
    hasActedThisRound: state.players.map(() => false),
  };
  const activeCount = countActivePlayers(next);

  if (activeCount <= 1) {
    const winnerIdx = next.players.findIndex((p) => !p.folded);
    next = awardAllPots(next, gameNumber);
    next.phase = PHASES.SHOWDOWN;
    next.bettingRound = PHASES.SHOWDOWN;
    if (winnerIdx >= 0 && activeCount === 1) {
      next.winnerIndex = winnerIdx;
      next.winnerIndices = [winnerIdx];
      next.winnerReason = getHandTier(next.players[winnerIdx].holeCards, next.communityCards).reason;
    }
    return next;
  }

  if (next.bettingRound === PHASES.PREFLOP) {
    next = dealFlop(next);
    next.bettingRound = PHASES.FLOP;
    next.currentPlayerIndex = getNextActivePlayerIndex(next, (next.dealerIndex + 1) % next.players.length);
  } else if (next.bettingRound === PHASES.FLOP) {
    next = dealTurn(next);
    next.bettingRound = PHASES.TURN;
    next.currentPlayerIndex = getNextActivePlayerIndex(next, (next.dealerIndex + 1) % next.players.length);
  } else if (next.bettingRound === PHASES.TURN) {
    next = dealRiver(next);
    next.bettingRound = PHASES.RIVER;
    next.currentPlayerIndex = getNextActivePlayerIndex(next, (next.dealerIndex + 1) % next.players.length);
  } else if (next.bettingRound === PHASES.RIVER) {
    next = resolveShowdown(next, gameNumber);
  }
  return next;
}

function resolveShowdown(state, gameNumber) {
  const active = state.players.filter((p) => !p.folded);
  if (active.length === 0) return { ...state, phase: PHASES.SHOWDOWN, bettingRound: PHASES.SHOWDOWN };
  const next = awardAllPots({ ...state, players: state.players.map((p) => ({ ...p })) }, gameNumber);
  next.phase = PHASES.SHOWDOWN;
  next.bettingRound = PHASES.SHOWDOWN;
  return next;
}

export function isGameOver(state) {
  if (!state?.players?.length) return false;
  if ((state.gameNumber ?? 0) < 4) return false;
  if (state.phase !== PHASES.SHOWDOWN) return false;
  return state.players.some((p) => p.chips === 0);
}

/** Session winner when the game ended because someone busted (0 chips). */
export function getSessionWinnerIndex(state) {
  if (!isGameOver(state)) return null;
  const survivors = state.players
    .map((p, i) => ({ i, chips: p.chips }))
    .filter((x) => x.chips > 0);
  if (survivors.length !== 1) return null;
  return survivors[0].i;
}

function cardWeight(card) {
  return card?.mass ?? (card?.number ?? 0) * 2;
}

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

export function getBestHandWeight(holeCards, communityCards) {
  const { weight } = getBestHand(holeCards, communityCards);
  return weight;
}

export function getMoleculeCombo(holeCards, communityCards) {
  return matchMoleculeCombo(holeCards, communityCards);
}

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

function getHandTier(holeCards, communityCards) {
  const combo = getMoleculeCombo(holeCards, communityCards);
  const mol = getKnownMolecule(combo);
  if (mol) return { tier: mol.tier, mass: 0, reason: mol.id };
  const mass = getBestHandWeight(holeCards, communityCards);
  return { tier: MASS_TIER, mass, reason: 'mass' };
}

export function getWinner(gameState, gameNumber) {
  const { players, communityCards } = gameState;
  const active = players?.filter((p) => !p.folded) || [];
  if (!active.length) return { winnerIndex: 0, winnerIndices: [0], reason: 'mass' };
  if (active.length === 1) {
    const idx = players.indexOf(active[0]);
    const { reason } = getHandTier(active[0].holeCards, communityCards);
    return { winnerIndex: idx, winnerIndices: [idx], reason };
  }

  let bestTier = MASS_TIER + 1;
  let bestMass = 0;
  const candidates = [];
  active.forEach((p) => {
    const i = players.indexOf(p);
    const { tier, mass, reason } = getHandTier(p.holeCards, communityCards);
    const wins =
      tier < bestTier || (tier === bestTier && reason === 'mass' && mass > bestMass);
    if (wins) {
      bestTier = tier;
      bestMass = mass;
      candidates.length = 0;
      candidates.push({ index: i, tier, mass, reason });
    } else if (tier === bestTier && (reason !== 'mass' || mass === bestMass)) {
      candidates.push({ index: i, tier, mass, reason });
    }
  });

  const winnerIndices = candidates.map((c) => c.index);
  const winnerIndex = winnerIndices[0];
  const reason = getHandTier(players[winnerIndex].holeCards, communityCards).reason;
  return { winnerIndex, winnerIndices, reason };
}
