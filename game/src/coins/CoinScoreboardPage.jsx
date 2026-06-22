import React, { useEffect, useState } from 'react';
import { fetchCoinLeaderboard, formatCoinDate, rankCoinEntries } from '../coins/coins.js';

export function CoinScoreboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const entries = await fetchCoinLeaderboard();
        if (!cancelled) setRows(rankCoinEntries(entries));
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app scoreboard-page coin-scoreboard-page" data-testid="coin-scoreboard-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Coin scoreboard — prize coins for subscribers</p>
      </header>
      <main className="scoreboard-main">
        <h2 className="scoreboard-title">Coin scoreboard</h2>
        <p className="scoreboard-deck-hint">
          Subscribers earn coins for winning hands and full sessions. Token launch at 10,000 verified subscribers.
        </p>

        {loading && <p className="scoreboard-loading" data-testid="coin-scoreboard-loading">Loading…</p>}
        {error && <p className="scoreboard-err" data-testid="coin-scoreboard-error">{error}</p>}

        {!loading && !error && (
          <>
            {!rows.length ? (
              <p className="scoreboard-empty" data-testid="coin-scoreboard-empty">
                No prize coins yet. Subscribe and win a hand to appear here!
              </p>
            ) : (
              <div className="scoreboard-table-wrap">
                <table className="scoreboard-table" data-testid="coin-scoreboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Total coins</th>
                      <th>Last updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.rank}</td>
                        <td>{row.displayName}</td>
                        <td>{row.coinBalance}</td>
                        <td>{formatCoinDate(row.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <p className="scoreboard-back">
          <a href="/profile.html">Your profile</a>
          {' · '}
          <a href="/concept.html">How prize coins work</a>
          {' · '}
          <a href="/">← Back to game</a>
        </p>
      </main>
    </div>
  );
}
