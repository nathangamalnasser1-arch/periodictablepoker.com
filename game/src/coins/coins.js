import {
  collection, doc, runTransaction, getDocs, query, orderBy, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';

export const COIN_BOARD_ID = 'ptp-coins';

/** Prize coins for winning a hand at showdown (solo, game 4+). */
export const COINS_HAND_WIN = 10;

/** Prize coins for winning the full session (all chips). */
export const COINS_SESSION_WIN = 100;

export const COIN_AMOUNTS = new Set([COINS_HAND_WIN, COINS_SESSION_WIN]);

export const COIN_REASONS = {
  HAND_WIN: 'hand_win',
  SESSION_WIN: 'session_win',
};

export function shouldAwardHandWin({
  isSubscriber,
  gameNumber,
  humanIndex,
  winnerIndex,
  winnerIndices,
  isShowdown,
  isMultiplayer,
}) {
  if (!isSubscriber || gameNumber < 4 || !isShowdown || isMultiplayer) return false;
  const indices = winnerIndices?.length
    ? winnerIndices
    : (winnerIndex != null ? [winnerIndex] : []);
  return indices.includes(humanIndex);
}

export function shouldAwardSessionWin({
  isSubscriber,
  gameNumber,
  isGameOver,
  sessionWinnerIndex,
  humanIndex,
}) {
  if (!isSubscriber || gameNumber < 4 || !isGameOver) return false;
  return sessionWinnerIndex === humanIndex;
}

export function computeCoinAward({ handWin, sessionWin }) {
  let total = 0;
  const parts = [];
  if (handWin) {
    total += COINS_HAND_WIN;
    parts.push({ amount: COINS_HAND_WIN, reason: COIN_REASONS.HAND_WIN });
  }
  if (sessionWin) {
    total += COINS_SESSION_WIN;
    parts.push({ amount: COINS_SESSION_WIN, reason: COIN_REASONS.SESSION_WIN });
  }
  return { total, parts };
}

export function sortCoinEntriesByBalanceDesc(entries) {
  return [...entries].sort((a, b) => {
    const bal = (b.coinBalance ?? 0) - (a.coinBalance ?? 0);
    if (bal !== 0) return bal;
    return (b.updatedAtMs ?? 0) - (a.updatedAtMs ?? 0);
  });
}

export function rankCoinEntries(entries) {
  return sortCoinEntriesByBalanceDesc(entries).map((row, i) => ({
    ...row,
    rank: i + 1,
  }));
}

export function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds != null) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function formatCoinDate(value) {
  const ms = timestampToMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function mapCoinEntryDoc(id, data) {
  return {
    id,
    uid: data.uid ?? id,
    displayName: data.displayName ?? 'Player',
    coinBalance: data.coinBalance ?? 0,
    updatedAt: data.updatedAt ?? null,
    updatedAtMs: timestampToMs(data.updatedAt),
  };
}

/**
 * Award prize coins to a subscriber (Firestore transaction).
 * Writes transaction log, leaderboard entry, and user profile balance.
 */
export async function awardPrizeCoins({ uid, displayName, parts, gameNumber, isMultiplayer }) {
  if (!uid || !parts?.length) return { awarded: 0 };

  const total = parts.reduce((sum, p) => sum + p.amount, 0);
  if (!COIN_AMOUNTS.has(total) && parts.length === 1) {
    // single award — already validated by caller
  }

  const userRef = doc(db, 'users', uid);
  const entryRef = doc(db, 'leaderboards', COIN_BOARD_ID, 'entries', uid);
  const txCol = collection(db, 'leaderboards', COIN_BOARD_ID, 'transactions');

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    if (!userData.isSubscriber) {
      throw new Error('Only subscribers earn prize coins');
    }

    const prevBalance = userData.coinBalance ?? 0;
    const nextBalance = prevBalance + total;

    for (const part of parts) {
      const txRef = doc(txCol);
      transaction.set(txRef, {
        uid,
        amount: part.amount,
        reason: part.reason,
        gameNumber,
        isMultiplayer: !!isMultiplayer,
        displayName: displayName ?? userData.displayName ?? 'Player',
        createdAt: serverTimestamp(),
      });
    }

    transaction.set(entryRef, {
      uid,
      displayName: displayName ?? userData.displayName ?? 'Player',
      coinBalance: nextBalance,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(userRef, {
      coinBalance: nextBalance,
      displayName: displayName ?? userData.displayName ?? 'Player',
    }, { merge: true });
  });

  return { awarded: total };
}

export async function fetchCoinLeaderboard(max = 100) {
  const ref = collection(db, 'leaderboards', COIN_BOARD_ID, 'entries');
  const q = query(ref, orderBy('coinBalance', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapCoinEntryDoc(d.id, d.data()));
}
