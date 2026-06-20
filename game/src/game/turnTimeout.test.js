import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TURN_TIMEOUT_MS,
  TURN_TIMEOUT_SECONDS,
  stampTurnStartedAt,
  ensureTurnStamp,
  getTurnSecondsRemaining,
  isTurnExpired,
  getTimeoutAction,
  applyTurnTimeout,
  resolveGameProgress,
  processTurnWatchdog,
} from './turnTimeout.js';
import { PHASES, dealGame, playerAction } from './gameLogic.js';

describe('turnTimeout', () => {
  const baseState = () => {
    const g = dealGame(2, 4);
    return { ...g, turnStartedAt: Date.now() - TURN_TIMEOUT_MS - 1000 };
  };

  it('exports 60 second timeout', () => {
    expect(TURN_TIMEOUT_SECONDS).toBe(60);
    expect(TURN_TIMEOUT_MS).toBe(60_000);
  });

  it('stamps turnStartedAt when a player can act', () => {
    const g = dealGame(2, 4);
    expect(g.turnStartedAt).toBeTypeOf('number');
  });

  it('ensureTurnStamp adds stamp to legacy state', () => {
    const g = dealGame(2, 4);
    const legacy = { ...g, turnStartedAt: undefined };
    const stamped = ensureTurnStamp(legacy, 1000);
    expect(stamped.turnStartedAt).toBe(1000);
  });

  it('getTimeoutAction returns check when nothing to call', () => {
    const g = dealGame(2, 4);
    const matched = {
      ...g,
      phase: 'flop',
      bettingRound: 'flop',
      currentBet: 0,
      roundBets: [0, 0],
      currentPlayerIndex: 0,
    };
    expect(getTimeoutAction(matched, 0)).toBe('check');
  });

  it('getTimeoutAction returns fold when facing a bet', () => {
    const g = dealGame(2, 4);
    expect(getTimeoutAction(g, g.currentPlayerIndex)).toBe('fold');
  });

  it('isTurnExpired when past deadline', () => {
    const g = baseState();
    expect(isTurnExpired(g, Date.now())).toBe(true);
    expect(getTurnSecondsRemaining(g, Date.now())).toBe(0);
  });

  it('applyTurnTimeout auto-checks when toCall is 0', () => {
    const g0 = dealGame(2, 4);
    const g = {
      ...g0,
      phase: 'flop',
      bettingRound: 'flop',
      currentBet: 0,
      roundBets: [0, 0],
      currentPlayerIndex: 0,
      turnStartedAt: Date.now() - TURN_TIMEOUT_MS - 1000,
    };
    const { state, timedOut, action } = applyTurnTimeout(g, g.gameNumber, Date.now());
    expect(timedOut).toBe(true);
    expect(action).toBe('check');
    expect(state.lastAction?.timedOut).toBe(true);
  });

  it('applyTurnTimeout auto-folds when facing a bet', () => {
    const g = baseState();
    const actor = g.currentPlayerIndex;
    const { timedOut, action, state } = applyTurnTimeout(g, g.gameNumber, Date.now());
    expect(timedOut).toBe(true);
    expect(action).toBe('fold');
    expect(state.players[actor].folded).toBe(true);
  });

  it('does not timeout at showdown', () => {
    const g = { ...baseState(), phase: PHASES.SHOWDOWN };
    expect(isTurnExpired(g)).toBe(false);
    expect(applyTurnTimeout(g, 4).timedOut).toBe(false);
  });

  it('resolveGameProgress advances after timeout', () => {
    const g = baseState();
    const next = resolveGameProgress(g, g.gameNumber, Date.now());
    expect(next).not.toBe(g);
    expect(next.lastAction?.timedOut || next.phase === PHASES.SHOWDOWN).toBeTruthy();
  });

  it('resolveGameProgress deals flop when preflop betting completes', () => {
    let g = dealGame(2, 4);
    for (let step = 0; step < 24 && g.communityCards.length < 3; step += 1) {
      if (g.phase === PHASES.SHOWDOWN) break;
      const idx = g.currentPlayerIndex;
      const toCall = (g.currentBet ?? 0) - (g.roundBets?.[idx] ?? 0);
      const acted = playerAction(g, idx, toCall <= 0 ? 'check' : 'call');
      if (acted === g) break;
      g = resolveGameProgress(acted, g.gameNumber);
    }
    expect(g.communityCards).toHaveLength(3);
    expect(g.phase).toBe(PHASES.FLOP);
  });
});

describe('processTurnWatchdog', () => {
  it('returns unchanged when turn not expired', () => {
    const g = dealGame(2, 4);
    const { state, timedOut } = processTurnWatchdog(g, g.gameNumber, Date.now());
    expect(timedOut).toBe(false);
    expect(state).toBe(g);
  });
});
