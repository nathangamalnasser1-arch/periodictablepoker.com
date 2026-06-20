import React, { useState } from 'react';

export function Lobby({ mp, onSolo }) {
  const [gameName, setGameName] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [openCards, setOpenCards] = useState(false);

  if (mp.mode === 'waiting') {
    const ids = mp.lobbyData?.playerIds ?? [];
    const names = mp.lobbyData?.playerNames ?? [];
    const count = ids.filter(Boolean).length;
    return (
      <div className="lobby">
        <h2>Waiting Room</h2>
        <p className="lobby-keyword">
          Share this keyword: <strong>{mp.keyword}</strong>
        </p>
        <ul className="players-list">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className={ids[i] ? 'slot-filled' : 'slot-empty'}>
              {names[i] ?? '(empty slot)'}
            </li>
          ))}
        </ul>
        <p className="player-count">{count} / 5 players joined</p>
        {mp.openCards && (
          <p className="lobby-hint" data-testid="open-cards-badge">Open cards — all players see hole cards.</p>
        )}
        {mp.error && <p className="lobby-err">{mp.error}</p>}
        {mp.isHost ? (
          count >= mp.minPlayers
            ? <button className="btn-primary" onClick={mp.startGame}>Start Game ({count} players)</button>
            : <p className="lobby-hint">Need at least {mp.minPlayers} players to start.</p>
        ) : (
          <p className="lobby-hint">Waiting for host to start the game…</p>
        )}
        <button className="btn-secondary" onClick={mp.leave}>Leave Game</button>
      </div>
    );
  }

  if (mp.mode === 'lobby') {
    return (
      <div className="lobby">
        <h2>Online Lobby</h2>

        <div className="lobby-section lobby-open-games">
          <div className="lobby-section-header">
            <h3>Open Games</h3>
            <button
              type="button"
              className="btn-secondary btn-refresh-games"
              onClick={mp.refreshWaitingGames}
              disabled={mp.waitingGamesLoading}
              data-testid="refresh-open-games"
            >
              {mp.waitingGamesLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <p className="lobby-hint">Games waiting for players — updates automatically.</p>
          {mp.waitingGamesLoading && mp.waitingGames.length === 0 ? (
            <p className="lobby-empty" data-testid="open-games-loading">Loading games…</p>
          ) : mp.waitingGames.length === 0 ? (
            <p className="lobby-empty" data-testid="open-games-empty">
              No open games right now. Create one below or join with a keyword.
            </p>
          ) : (
            <ul className="waiting-games" data-testid="open-games-list">
              {mp.waitingGames.map(g => {
                const count = (g.playerIds ?? []).filter(Boolean).length;
                const hostName = g.playerNames?.[0] ?? 'Host';
                return (
                  <li key={g.id} className="waiting-game-row">
                    <div className="waiting-game-info">
                      <span className="waiting-game-name">{g.name}</span>
                      <span className="waiting-game-meta">
                        {g.keyword} · {count}/5 · host {hostName}
                        {g.openCards ? ' · open cards' : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      data-testid={`join-game-${g.id}`}
                      onClick={() => mp.joinByKeyword(g.keyword)}
                    >
                      Join
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lobby-section">
          <h3>Create a Game</h3>
          <input
            type="text"
            placeholder="Enter a game name"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && mp.create(gameName)}
            className="lobby-input"
          />
          <label className="lobby-checkbox" data-testid="open-cards-option">
            <input
              type="checkbox"
              checked={openCards}
              onChange={(e) => setOpenCards(e.target.checked)}
            />
            Open cards (everyone sees all hole cards)
          </label>
          <button
            className="btn-primary"
            onClick={() => mp.create(gameName, { openCards })}
            disabled={!gameName.trim()}
          >
            Create
          </button>
        </div>

        <div className="lobby-section">
          <h3>Join by Keyword</h3>
          <input
            type="text"
            placeholder="game-keyword"
            value={joinKey}
            onChange={e => setJoinKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && mp.joinByKeyword(joinKey)}
            className="lobby-input"
          />
          <button
            className="btn-primary"
            onClick={() => mp.joinByKeyword(joinKey)}
            disabled={!joinKey.trim()}
          >
            Join
          </button>
        </div>

        {mp.error && <p className="lobby-err">{mp.error}</p>}
        <button className="btn-secondary" onClick={onSolo}>← Back</button>
      </div>
    );
  }

  return null;
}
