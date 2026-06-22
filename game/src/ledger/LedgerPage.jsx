import React, { useEffect, useState, useMemo } from 'react';
import { fetchLedgerEvents } from './ledgerService.js';
import {
  formatLedgerDate,
  formatLedgerEventType,
  formatLedgerHandPot,
  filterLedgerByPlayerName,
  filterLedgerByEventType,
} from './ledger.js';

const EVENT_FILTERS = [
  { id: 'all', label: 'All events' },
  { id: 'hand_win', label: 'Hand wins' },
  { id: 'session_win', label: 'Session wins' },
  { id: 'stat_update', label: 'Stat updates' },
];

export function LedgerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const events = await fetchLedgerEvents();
        if (!cancelled) setRows(events);
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = filterLedgerByEventType(rows, eventFilter);
    list = filterLedgerByPlayerName(list, search);
    return list;
  }, [rows, search, eventFilter]);

  return (
    <div className="app scoreboard-page ledger-page" data-testid="ledger-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Competition prize ledger</p>
      </header>
      <main className="scoreboard-main">
        <h2 className="scoreboard-title">Public ledger</h2>
        <p className="scoreboard-deck-hint">
          Public record of wins and prize coins — on-chain anchoring coming at token launch.
        </p>

        <div className="ledger-filters" data-testid="ledger-filters">
          <input
            type="search"
            placeholder="Search by player name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="player-hierarchy-input ledger-search"
            data-testid="ledger-search"
          />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="ledger-event-filter"
            data-testid="ledger-event-filter"
          >
            {EVENT_FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        {loading && <p className="scoreboard-loading" data-testid="ledger-loading">Loading…</p>}
        {error && <p className="scoreboard-err" data-testid="ledger-error">{error}</p>}

        {!loading && !error && (
          <>
            {!filtered.length ? (
              <p className="scoreboard-empty" data-testid="ledger-empty">
                No ledger entries yet.
              </p>
            ) : (
              <div className="scoreboard-table-wrap">
                <table className="scoreboard-table" data-testid="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Player</th>
                      <th>Event</th>
                      <th>Hand / Pot</th>
                      <th>Coins</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td>{formatLedgerDate(row.createdAt)}</td>
                        <td>{row.displayName}</td>
                        <td>{formatLedgerEventType(row.eventType)}</td>
                        <td>{formatLedgerHandPot(row)}</td>
                        <td>{row.coinsAwarded > 0 ? `+${row.coinsAwarded}` : '—'}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <p className="scoreboard-back">
          <a href="/rankings.html">Rankings</a>
          {' · '}
          <a href="/">← Back to game</a>
        </p>
      </main>
    </div>
  );
}
