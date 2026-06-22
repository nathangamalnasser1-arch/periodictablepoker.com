import { useEffect, useRef, useState } from 'react';
import { getSessionWinnerIndex } from '../game/gameLogic.js';
import {
  shouldAwardHandWin,
  shouldAwardSessionWin,
  computeCoinAward,
} from '../coins/coins.js';
import {
  shouldTrackStats,
  humanPlayedHand,
  computeStatDeltas,
} from '../stats/stats.js';
import { recordGameplayOutcome } from '../stats/statsService.js';

/**
 * Records subscriber stats, ledger rows, and prize coins once per session/hand event.
 */
export function useGameplayRecorder({
  gameState,
  gameNumber,
  isGameOver,
  humanIndex,
  isMultiplayer,
  isSubscriber,
  uid,
  displayName,
  onAwarded,
  onStatsUpdated,
  onGuestNudge,
}) {
  const [coinToast, setCoinToast] = useState(null);
  const sessionKeyRef = useRef(null);
  const showdownKeyRef = useRef(null);
  const nudgedKeyRef = useRef(null);

  useEffect(() => {
    if (!gameState || gameNumber < 4) return;
    if (!shouldTrackStats({ isSubscriber: true, gameNumber })) return;
    if (gameState.phase !== 'preflop' || !gameState.gameStartTime) return;

    const sessionKey = `start-${gameState.gameStartTime}`;
    if (sessionKeyRef.current === sessionKey) return;

    if (!isSubscriber || !uid) return;

    sessionKeyRef.current = sessionKey;
    let cancelled = false;

    (async () => {
      try {
        await recordGameplayOutcome({
          uid,
          displayName,
          gameNumber,
          isMultiplayer,
          sessionStart: true,
        });
        if (!cancelled) onStatsUpdated?.();
      } catch {
        sessionKeyRef.current = null;
      }
    })();

    return () => { cancelled = true; };
  }, [
    gameState?.gameStartTime,
    gameState?.phase,
    gameNumber,
    isMultiplayer,
    isSubscriber,
    uid,
    displayName,
    onStatsUpdated,
  ]);

  useEffect(() => {
    if (!gameState || gameState.phase !== 'showdown' || gameNumber < 4) return;

    const sessionWinnerIndex = getSessionWinnerIndex(gameState);
    const qualifiesHand = shouldAwardHandWin({
      isSubscriber: true,
      gameNumber,
      humanIndex,
      winnerIndex: gameState.winnerIndex,
      winnerIndices: gameState.winnerIndices,
      isShowdown: true,
      isMultiplayer,
    });
    const qualifiesSession = shouldAwardSessionWin({
      isSubscriber: true,
      gameNumber,
      isGameOver,
      sessionWinnerIndex,
      humanIndex,
    });
    const playedHand = humanPlayedHand(gameState, humanIndex);
    const hasStatEvent = playedHand || qualifiesSession;

    if (!hasStatEvent && !qualifiesHand && !qualifiesSession) return;

    const showdownKey = `${gameState.gameStartTime ?? 'x'}-${gameNumber}-${qualifiesHand ? 'h' : ''}${qualifiesSession ? 's' : ''}${playedHand ? 'p' : ''}-${isGameOver ? 'end' : 'sd'}`;

    const wouldEarn = qualifiesHand || qualifiesSession || playedHand;
    if (!isSubscriber || !uid) {
      if (wouldEarn && nudgedKeyRef.current !== showdownKey) {
        nudgedKeyRef.current = showdownKey;
        onGuestNudge?.();
      }
      return;
    }

    if (showdownKeyRef.current === showdownKey) return;
    showdownKeyRef.current = showdownKey;

    const statPayload = computeStatDeltas({
      gameState,
      gameNumber,
      isGameOver,
      humanIndex,
      sessionStart: false,
    });

    const handWin = qualifiesHand;
    const sessionWin = qualifiesSession;
    const { total, parts } = computeCoinAward({ handWin, sessionWin });

    let cancelled = false;
    (async () => {
      try {
        const result = await recordGameplayOutcome({
          uid,
          displayName,
          gameNumber,
          isMultiplayer,
          statPayload,
          coinParts: parts,
        });
        if (cancelled) return;
        if (result.coinsAwarded > 0) {
          setCoinToast(`+${result.coinsAwarded} prize coins`);
          onAwarded?.(result.coinsAwarded);
        }
        onStatsUpdated?.();
      } catch {
        showdownKeyRef.current = null;
      }
    })();

    return () => { cancelled = true; };
  }, [
    gameState,
    gameNumber,
    isGameOver,
    humanIndex,
    isMultiplayer,
    isSubscriber,
    uid,
    displayName,
    onAwarded,
    onStatsUpdated,
    onGuestNudge,
  ]);

  return { coinToast, clearCoinToast: () => setCoinToast(null) };
}
