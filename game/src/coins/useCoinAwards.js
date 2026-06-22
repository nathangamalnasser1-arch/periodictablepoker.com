import { useEffect, useRef, useState } from 'react';
import { getSessionWinnerIndex } from '../game/gameLogic.js';
import {
  shouldAwardHandWin,
  shouldAwardSessionWin,
  computeCoinAward,
  awardPrizeCoins,
} from './coins.js';

/**
 * Awards prize coins once per qualifying showdown / session end.
 */
export function useCoinAwards({
  gameState,
  gameNumber,
  isGameOver,
  humanIndex,
  isMultiplayer,
  isSubscriber,
  uid,
  displayName,
  onAwarded,
  onGuestNudge,
}) {
  const [lastToast, setLastToast] = useState(null);
  const awardedKeyRef = useRef(null);
  const nudgedKeyRef = useRef(null);

  useEffect(() => {
    if (!gameState || gameState.phase !== 'showdown') return;

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

    if (!qualifiesHand && !qualifiesSession) return;

    const eventKey = `${gameNumber}-${qualifiesHand ? 'h' : ''}${qualifiesSession ? 's' : ''}-${isGameOver ? 'end' : 'sd'}`;

    if (!isSubscriber || !uid) {
      if (nudgedKeyRef.current !== eventKey) {
        nudgedKeyRef.current = eventKey;
        onGuestNudge?.();
      }
      return;
    }

    if (awardedKeyRef.current === eventKey) return;
    awardedKeyRef.current = eventKey;

    const handWin = qualifiesHand;
    const sessionWin = qualifiesSession;
    const { total, parts } = computeCoinAward({ handWin, sessionWin });
    if (total <= 0) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await awardPrizeCoins({
          uid,
          displayName,
          parts,
          gameNumber,
          isMultiplayer,
        });
        if (cancelled) return;
        setLastToast(`+${result.awarded} prize coins`);
        onAwarded?.(result.awarded);
      } catch {
        awardedKeyRef.current = null;
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
    onGuestNudge,
  ]);

  return { coinToast: lastToast, clearCoinToast: () => setLastToast(null) };
}
