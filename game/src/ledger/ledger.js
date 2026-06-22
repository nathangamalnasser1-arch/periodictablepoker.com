export const LEDGER_ID = 'ptp-champions';

export const LEDGER_EVENT_TYPES = new Set(['hand_win', 'session_win', 'stat_update']);

export function buildLedgerEvents({
  sessionStart,
  statPayload,
  coinParts,
  coinTotal,
  gameNumber,
  isMultiplayer,
  uid,
  displayName,
}) {
  const events = [];
  const name = displayName ?? 'Player';

  if (sessionStart) {
    events.push({
      uid,
      displayName: name,
      eventType: 'stat_update',
      gameNumber,
      isMultiplayer: !!isMultiplayer,
      potWon: 0,
      handWeight: 0,
      winnerReason: null,
      coinsAwarded: 0,
    });
  }

  if (statPayload?.handWin) {
    events.push({
      uid,
      displayName: name,
      eventType: 'hand_win',
      gameNumber,
      isMultiplayer: !!isMultiplayer,
      potWon: statPayload.potWon ?? 0,
      handWeight: statPayload.handWeight ?? 0,
      winnerReason: statPayload.winnerReason ?? null,
      coinsAwarded: coinParts?.find((p) => p.reason === 'hand_win')?.amount ?? 0,
    });
  }

  if (statPayload?.sessionWin) {
    events.push({
      uid,
      displayName: name,
      eventType: 'session_win',
      gameNumber,
      isMultiplayer: !!isMultiplayer,
      potWon: statPayload.potWon ?? 0,
      handWeight: statPayload.handWeight ?? 0,
      winnerReason: statPayload.winnerReason ?? null,
      coinsAwarded: coinParts?.find((p) => p.reason === 'session_win')?.amount ?? 0,
    });
  } else if (statPayload && !statPayload.handWin && statPayload.deltas?.handsPlayed) {
    events.push({
      uid,
      displayName: name,
      eventType: 'stat_update',
      gameNumber,
      isMultiplayer: !!isMultiplayer,
      potWon: 0,
      handWeight: statPayload.handWeight ?? 0,
      winnerReason: null,
      coinsAwarded: 0,
    });
  }

  if (coinTotal > 0 && !events.some((e) => e.coinsAwarded > 0)) {
    events.push({
      uid,
      displayName: name,
      eventType: 'stat_update',
      gameNumber,
      isMultiplayer: !!isMultiplayer,
      potWon: 0,
      handWeight: 0,
      winnerReason: null,
      coinsAwarded: coinTotal,
    });
  }

  return events;
}

export function formatLedgerEventType(eventType) {
  if (eventType === 'hand_win') return 'Hand win';
  if (eventType === 'session_win') return 'Session win';
  if (eventType === 'stat_update') return 'Stat update';
  return eventType ?? '—';
}

export function formatLedgerHandPot(row) {
  const parts = [];
  if (row.handWeight > 0) parts.push(`${row.handWeight} u`);
  if (row.potWon > 0) parts.push(`${row.potWon} pot`);
  return parts.length ? parts.join(' · ') : '—';
}

export function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds != null) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function formatLedgerDate(value) {
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

export function mapLedgerDoc(id, data) {
  return {
    id,
    uid: data.uid ?? '',
    displayName: data.displayName ?? 'Player',
    eventType: data.eventType ?? 'stat_update',
    gameNumber: data.gameNumber ?? 0,
    isMultiplayer: !!data.isMultiplayer,
    potWon: data.potWon ?? 0,
    handWeight: data.handWeight ?? 0,
    winnerReason: data.winnerReason ?? null,
    coinsAwarded: data.coinsAwarded ?? 0,
    status: data.status ?? 'CONFIRMED',
    txSignature: data.txSignature ?? null,
    createdAt: data.createdAt ?? null,
    createdAtMs: timestampToMs(data.createdAt),
  };
}

export function filterLedgerByPlayerName(rows, search) {
  const q = (search ?? '').trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => row.displayName.toLowerCase().includes(q));
}

export function filterLedgerByEventType(rows, eventType) {
  if (!eventType || eventType === 'all') return rows;
  return rows.filter((row) => row.eventType === eventType);
}
