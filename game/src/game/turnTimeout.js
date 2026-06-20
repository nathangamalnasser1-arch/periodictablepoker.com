import {
  playerAction,
  advanceBettingRound,
  isBettingRoundComplete,
  runOutBoardWhenLocked,
  autoAdvanceIdlePlayers,
  isRunOutLocked,
  canAct,
  PHASES,
} from './gameLogic.js';

export const TURN_TIMEOUT_MS = 60_000;
export const TURN_TIMEOUT_SECONDS = TURN_TIMEOUT_MS / 1000;
/** Solo bots get botAction first; safety re-fire before fold/check timeout. */
export const BOT_TURN_GRACE_MS = 2_000;
export const WATCHDOG_INTERVAL_MS = 1_000;

export function shouldWatchTurn(state) {
  if (!state?.players?.length) return false;
  if (state.phase === PHASES.SHOWDOWN) return false;
  if (state.moleculeTest) return false;
  if (isRunOutLocked(state)) return false;
  const idx = state.currentPlayerIndex;
  if (idx == null) return false;
  return canAct(state, idx);
}

export function stampTurnStartedAt(state, now = Date.now()) {
  if (!shouldWatchTurn(state)) {
    const { turnStartedAt, ...rest } = state ?? {};
    return rest;
  }
  return { ...state, turnStartedAt: now };
}

export function ensureTurnStamp(state, now = Date.now()) {
  if (!shouldWatchTurn(state)) return state;
  if (state.turnStartedAt != null) return state;
  return stampTurnStartedAt(state, now);
}

export function getTurnDeadline(state) {
  if (!shouldWatchTurn(state) || state.turnStartedAt == null) return null;
  return state.turnStartedAt + TURN_TIMEOUT_MS;
}

export function getTurnSecondsRemaining(state, now = Date.now()) {
  const deadline = getTurnDeadline(state);
  if (deadline == null) return null;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function isTurnExpired(state, now = Date.now()) {
  if (!shouldWatchTurn(state)) return false;
  const started = state.turnStartedAt ?? now;
  return now - started >= TURN_TIMEOUT_MS;
}

export function getTimeoutAction(state, playerIndex) {
  const toCall = (state.currentBet ?? 0) - (state.roundBets?.[playerIndex] ?? 0);
  return toCall <= 0 ? 'check' : 'fold';
}

/** After any action: deal next street if round complete, skip idle seats, stamp turn. */
function advanceAfterAction(state, gameNumber) {
  let s = state;
  if (isBettingRoundComplete(s)) {
    const runOut = runOutBoardWhenLocked(s, gameNumber);
    s = runOut !== s ? runOut : advanceBettingRound(s, gameNumber);
  }
  s = autoAdvanceIdlePlayers(s, gameNumber);
  if (s === state) return state;
  return stampTurnStartedAt(s);
}

/**
 * Apply check/fold if turn deadline passed. Returns { state, timedOut, action }.
 */
export function applyTurnTimeout(state, gameNumber, now = Date.now()) {
  if (!isTurnExpired(state, now)) {
    return { state, timedOut: false };
  }
  const idx = state.currentPlayerIndex;
  const action = getTimeoutAction(state, idx);
  let next = playerAction(state, idx, action);
  if (next === state) {
    return { state, timedOut: false };
  }
  next = advanceAfterAction(next, gameNumber);
  if (next.lastAction) {
    next = {
      ...next,
      lastAction: { ...next.lastAction, timedOut: true },
    };
  }
  return { state: next, timedOut: true, action };
}

/** After any action: advance streets when betting completes, then apply timeouts. */
export function resolveGameProgress(state, gameNumber, now = Date.now(), maxSteps = 12) {
  let s = state;
  for (let i = 0; i < maxSteps; i++) {
    if (s.phase === PHASES.SHOWDOWN) break;

    const before = s;
    s = advanceAfterAction(s, gameNumber);
    if (s !== before) continue;

    const { state: afterTimeout, timedOut } = applyTurnTimeout(s, gameNumber, now);
    if (timedOut) {
      s = afterTimeout;
      continue;
    }

    break;
  }
  return stampTurnStartedAt(s, now);
}

/** Host watchdog tick: apply timeout once if due. */
export function processTurnWatchdog(state, gameNumber, now = Date.now()) {
  if (!shouldWatchTurn(state)) {
    return { state, timedOut: false };
  }
  if (isRunOutLocked(state)) {
    const advanced = autoAdvanceIdlePlayers(state, gameNumber);
    if (advanced !== state) {
      return { state: stampTurnStartedAt(advanced, now), timedOut: false };
    }
    return { state, timedOut: false };
  }
  return applyTurnTimeout(state, gameNumber, now);
}
