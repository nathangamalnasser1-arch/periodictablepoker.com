import React, { useEffect, useState, useMemo } from 'react';
import { fetchAllStatsEntries } from '../stats/statsService.js';
import { RANKING_TABS, rankEntries, formatBestHandLabel } from './rankings.js';
import { moleculeLabel } from '../scoreboard/scoreboard.js';

export function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeTab, setActiveTab] = useState('champions');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchAllStatsEntries();
        if (!cancelled) setEntries(rows);
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const ranked = useMemo(
    () => rankEntries(entries, activeTab),
    [entries, activeTab],
  );

  return (
    <div className="app scoreboard-page rankings-page" data-testid="rankings-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Player rankings — subscribers only</p>
      </header>
      <main className="scoreboard-main">
        <h2 className="scoreboard-title">Rankings</h2>
        <p className="scoreboard-deck-hint">
          Champions, best hands, prize coins, and overall score. Stats accumulate as subscribers play.
        </p>

        {loading && <p className="scoreboard-loading" data-testid="rankings-loading">Loading…</p>}
        {error && <p className="scoreboard-err" data-testid="rankings-error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="scoreboard-tabs" role="tablist">
              {RANKING_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? 'scoreboard-tab active' : 'scoreboard-tab'}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`rankings-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!ranked.length ? (
              <p className="scoreboard-empty" data-testid="rankings-empty">
                No ranked players yet. Subscribe and play to appear here!
              </p>
            ) : (
              <div className="scoreboard-table-wrap">
                <table className="scoreboard-table" data-testid="rankings-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Games won</th>
                      <th>Best hand</th>
                      <th>Highest win</th>
                      <th>Coins</th>
                      {activeTab === 'overall' && <th>Score</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((row) => (
                      <tr key={row.id}>
                        <td>{row.rank}</td>
                        <td>{row.displayName}</td>
                        <td>{row.gamesWon}</td>
                        <td>{formatBestHandLabel(row.bestHandWeight, row.bestHandReason, moleculeLabel)}</td>
                        <td>{row.highestPotWin || '—'}</td>
                        <td>{row.coinBalance}</td>
                        {activeTab === 'overall' && <td>{row.composite}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <p className="scoreboard-back">
          <a href="/ledger.html">Public ledger</a>
          {' · '}
          <a href="/profile.html">Your profile</a>
          {' · '}
          <a href="/">← Back to game</a>
        </p>
      </main>
    </div>
  );
}
