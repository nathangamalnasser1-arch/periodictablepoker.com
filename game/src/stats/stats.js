import { getBestHandWeight, getSessionWinnerIndex, buildSidePots, getWinner } from '../game/gameLogic.js';

export const STATS_BOARD_ID = 'ptp-stats';

export const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  handsPlayed: 0,
  handsWon: 0,
  bestHandWeight: 0,
  bestHandReason: null,
  highestPotWin: 0,
};

export function shouldTrackStats({ isSubscriber, gameNumber }) {
  return isSubscriber && gameNumber >= 4;
}

export function humanPlayedHand(gameState, humanIndex) {
  const player = gameState?.players?.[humanIndex];
  return !!player && !player.folded;
}

export function humanWonHand(gameState, humanIndex) {
  const indices = gameState?.winnerIndices?.length
    ? gameState.winnerIndices
    : (gameState?.winnerIndex != null ? [gameState.winnerIndex] : []);
  return indices.includes(humanIndex);
}

export function computeHandWeight(gameState, humanIndex) {
  const player = gameState?.players?.[humanIndex];
  if (!player?.holeCards) return 0;
  return getBestHandWeight(player.holeCards, gameState.communityCards ?? []);
}

export function computePotWonByPlayer(gameState, humanIndex, gameNumber) {
  if (!humanWonHand(gameState, humanIndex)) return 0;
  const totalBetThisHand = gameState?.totalBetThisHand;
  const players = gameState?.players;
  if (!totalBetThisHand?.length || !players?.length) return gameState?.pot ?? 0;

  const pots = buildSidePots(totalBetThisHand, players.map((p) => p.folded));
  let won = 0;
  for (const layer of pots) {
    const subState = {
      players: players.map((p, i) => ({
        ...p,
        folded: p.folded || !layer.eligible.includes(i),
      })),
      communityCards: gameState.communityCards ?? [],
    };
    const { winnerIndices } = getWinner(subState, gameNumber);
    if (winnerIndices.includes(humanIndex)) {
      const share = Math.floor(layer.amount / winnerIndices.length);
      won += share;
    }
  }
  return won;
}

export function computeStatDeltas({
  gameState,
  gameNumber,
  isGameOver,
  humanIndex,
  sessionStart,
}) {
  const deltas = { ...DEFAULT_STATS };
  if (sessionStart) {
    deltas.gamesPlayed = 1;
    return { deltas, handWeight: 0, potWon: 0, winnerReason: null, sessionWin: false, handWin: false };
  }

  if (!gameState || gameState.phase !== 'showdown') {
    return null;
  }

  if (humanPlayedHand(gameState, humanIndex)) {
    deltas.handsPlayed = 1;
  }

  if (humanWonHand(gameState, humanIndex)) {
    deltas.handsWon = 1;
  }

  const sessionWinnerIndex = getSessionWinnerIndex(gameState);
  if (isGameOver && sessionWinnerIndex === humanIndex) {
    deltas.gamesWon = 1;
  }

  const handWeight = humanPlayedHand(gameState, humanIndex)
    ? computeHandWeight(gameState, humanIndex)
    : 0;
  const potWon = computePotWonByPlayer(gameState, humanIndex, gameNumber);
  const winnerReason = humanWonHand(gameState, humanIndex)
    ? (gameState.winnerReason ?? null)
    : null;

  return {
    deltas,
    handWeight,
    potWon,
    winnerReason,
    sessionWin: deltas.gamesWon === 1,
    handWin: deltas.handsWon === 1,
  };
}

export function mergeStats(existing, deltas, handWeight, winnerReason, potWon) {
  const base = { ...DEFAULT_STATS, ...existing };
  return {
    gamesPlayed: base.gamesPlayed + (deltas.gamesPlayed ?? 0),
    gamesWon: base.gamesWon + (deltas.gamesWon ?? 0),
    handsPlayed: base.handsPlayed + (deltas.handsPlayed ?? 0),
    handsWon: base.handsWon + (deltas.handsWon ?? 0),
    bestHandWeight: Math.max(base.bestHandWeight ?? 0, handWeight ?? 0),
    bestHandReason:
      (handWeight ?? 0) >= (base.bestHandWeight ?? 0) && winnerReason
        ? winnerReason
        : base.bestHandReason,
    highestPotWin: Math.max(base.highestPotWin ?? 0, potWon ?? 0),
  };
}

export function compositeScore(entry) {
  const gamesWon = entry.gamesWon ?? 0;
  const coinBalance = entry.coinBalance ?? 0;
  const bestHandWeight = entry.bestHandWeight ?? 0;
  return gamesWon * 100 + coinBalance + Math.floor(bestHandWeight / 10);
}

export function mapStatsEntryDoc(id, data) {
  return {
    id,
    uid: data.uid ?? id,
    displayName: data.displayName ?? 'Player',
    gamesPlayed: data.gamesPlayed ?? 0,
    gamesWon: data.gamesWon ?? 0,
    handsPlayed: data.handsPlayed ?? 0,
    handsWon: data.handsWon ?? 0,
    bestHandWeight: data.bestHandWeight ?? 0,
    bestHandReason: data.bestHandReason ?? null,
    highestPotWin: data.highestPotWin ?? 0,
    coinBalance: data.coinBalance ?? 0,
    updatedAt: data.updatedAt ?? null,
    composite: compositeScore(data),
  };
}
