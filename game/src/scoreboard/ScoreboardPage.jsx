import React, { useEffect, useState } from 'react';
import {
  fetchMoleculeScores,
  groupScoresByMolecule,
  moleculeLabel,
  formatScoreDate,
} from './scoreboard.js';

const TABS = [
  { id: 'chonp', label: 'CHONP' },
  { id: 'h2o', label: 'H₂O' },
  { id: 'nacl', label: 'NaCl' },
];

function ScoreTable({ scores, molecule }) {
  if (!scores.length) {
    return (
      <p className="scoreboard-empty" data-testid={`scoreboard-empty-${molecule}`}>
        No {moleculeLabel(molecule)} wins yet.
      </p>
    );
  }

  return (
    <div className="scoreboard-table-wrap">
      <table className="scoreboard-table" data-testid={`scoreboard-table-${molecule}`}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Game #</th>
            <th>Hand weight</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((row, i) => (
            <tr key={row.id}>
              <td>{i + 1}</td>
              <td>{row.displayName}</td>
              <td>{row.gameNumber}</td>
              <td>{row.handWeight} u</td>
              <td>{formatScoreDate(row.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScoreboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState({ chonp: [], h2o: [], nacl: [] });
  const [activeTab, setActiveTab] = useState('chonp');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const scores = await fetchMoleculeScores();
        if (!cancelled) setGroups(groupScoresByMolecule(scores));
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="app scoreboard-page" data-testid="scoreboard-page">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Scoreboard — molecule wins (NaCl, H₂O, CHONP)</p>
      </header>
      <main className="scoreboard-main">
        <h2 className="scoreboard-title">Scoreboard</h2>

        {loading && <p className="scoreboard-loading" data-testid="scoreboard-loading">Loading…</p>}
        {error && <p className="scoreboard-err" data-testid="scoreboard-error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="scoreboard-tabs" role="tablist">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? 'scoreboard-tab active' : 'scoreboard-tab'}
                  onClick={() => setActiveTab(tab.id)}
                  data-testid={`scoreboard-tab-${tab.id}`}
                >
                  {tab.label}
                  <span className="scoreboard-tab-count">({groups[tab.id]?.length ?? 0})</span>
                </button>
              ))}
            </div>
            <ScoreTable scores={groups[activeTab] ?? []} molecule={activeTab} />
            {!groups.chonp.length && !groups.h2o.length && !groups.nacl.length && (
              <p className="scoreboard-empty" data-testid="scoreboard-empty-all">
                No molecule wins yet. Win a hand with NaCl, H₂O, or CHONP and submit from the game!
              </p>
            )}
          </>
        )}

        <p className="scoreboard-back">
          <a href="/">← Back to game</a>
        </p>
      </main>
    </div>
  );
}
