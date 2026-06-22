import {
  collection, doc, runTransaction, getDocs, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { COIN_BOARD_ID, COIN_AMOUNTS } from '../coins/coins.js';
import {
  DEFAULT_STATS,
  STATS_BOARD_ID,
  mergeStats,
  mapStatsEntryDoc,
} from './stats.js';
import { buildLedgerEvents } from '../ledger/ledger.js';

const LEDGER_ROOT = 'ledger';
const LEDGER_ID = 'ptp-champions';

/**
 * Record session start, showdown stats, optional coin awards, and ledger rows atomically.
 */
export async function recordGameplayOutcome({
  uid,
  displayName,
  gameNumber,
  isMultiplayer,
  sessionStart = false,
  statPayload = null,
  coinParts = [],
}) {
  if (!uid) return { recorded: false };

  const userRef = doc(db, 'users', uid);
  const statsRef = doc(db, 'leaderboards', STATS_BOARD_ID, 'entries', uid);
  const coinEntryRef = doc(db, 'leaderboards', COIN_BOARD_ID, 'entries', uid);
  const coinTxCol = collection(db, 'leaderboards', COIN_BOARD_ID, 'transactions');
  const ledgerCol = collection(db, LEDGER_ROOT, LEDGER_ID, 'events');

  const coinTotal = (coinParts ?? []).reduce((sum, p) => sum + p.amount, 0);
  const ledgerEvents = buildLedgerEvents({
    sessionStart,
    statPayload,
    coinParts,
    coinTotal,
    gameNumber,
    isMultiplayer,
    uid,
    displayName,
  });

  if (!sessionStart && !statPayload && coinTotal <= 0) {
    return { recorded: false };
  }

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const userData = userSnap.data() ?? {};
    if (!userData.isSubscriber) {
      throw new Error('Only subscribers earn stats');
    }

    const existing = {
      ...DEFAULT_STATS,
      gamesPlayed: userData.gamesPlayed ?? 0,
      gamesWon: userData.gamesWon ?? 0,
      handsPlayed: userData.handsPlayed ?? 0,
      handsWon: userData.handsWon ?? 0,
      bestHandWeight: userData.bestHandWeight ?? 0,
      bestHandReason: userData.bestHandReason ?? null,
      highestPotWin: userData.highestPotWin ?? 0,
    };

    let nextStats = existing;
    if (sessionStart) {
      nextStats = mergeStats(existing, { gamesPlayed: 1 }, 0, null, 0);
    } else if (statPayload) {
      nextStats = mergeStats(
        existing,
        statPayload.deltas,
        statPayload.handWeight,
        statPayload.winnerReason,
        statPayload.potWon,
      );
    }

    let nextCoinBalance = userData.coinBalance ?? 0;
    if (coinTotal > 0) {
      nextCoinBalance += coinTotal;
      for (const part of coinParts) {
        if (!COIN_AMOUNTS.has(part.amount)) continue;
        const txRef = doc(coinTxCol);
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
      transaction.set(coinEntryRef, {
        uid,
        displayName: displayName ?? userData.displayName ?? 'Player',
        coinBalance: nextCoinBalance,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    transaction.set(userRef, {
      ...nextStats,
      coinBalance: nextCoinBalance,
      displayName: displayName ?? userData.displayName ?? 'Player',
    }, { merge: true });

    transaction.set(statsRef, {
      uid,
      displayName: displayName ?? userData.displayName ?? 'Player',
      ...nextStats,
      coinBalance: nextCoinBalance,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    for (const event of ledgerEvents) {
      const ledgerRef = doc(ledgerCol);
      transaction.set(ledgerRef, {
        ...event,
        createdAt: serverTimestamp(),
        txSignature: null,
        status: 'CONFIRMED',
      });
    }
  });

  return { recorded: true, coinsAwarded: coinTotal };
}

export async function fetchStatsLeaderboard(max = 100) {
  const ref = collection(db, 'leaderboards', STATS_BOARD_ID, 'entries');
  const q = query(ref, orderBy('gamesWon', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapStatsEntryDoc(d.id, d.data()));
}

export async function fetchAllStatsEntries(max = 200) {
  const ref = collection(db, 'leaderboards', STATS_BOARD_ID, 'entries');
  const snap = await getDocs(query(ref, limit(max)));
  return snap.docs.map((d) => mapStatsEntryDoc(d.id, d.data()));
}
