import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { getBestHand, getHandRank, getMoleculeCombo, PHASES, TOTAL_ATOMCOINS } from '../game/gameLogic.js';

/** Format hand for display: CHONP / H₂O / NaCl or "X u" */
function formatHandLabel(rank) {
  if (!rank) return '—';
  if (rank.combo === 'chonp') return 'CHONP';
  if (rank.combo === 'h2o') return 'H₂O';
  if (rank.combo === 'nacl') return 'NaCl';
  return `${rank.weight} u`;
}

/** Build GitHub issue URL for hierarchy proposal (reviewed when reactions reach 10k) */
function buildHierarchyIssueUrl(repo, playerName, bestHand) {
  const hand = bestHand && (bestHand.cards?.length || bestHand.weight != null)
    ? { ...bestHand, weight: bestHand.weight ?? 0 }
    : null;
  const handStr = hand?.cards?.length
    ? hand.cards.map((c) => `${c.symbol} (${(c.mass ?? c.number).toFixed(1)}u)`).join(', ')
    : '';
  const title = `Hierarchy: ${formatHandLabel(hand)} — ${(playerName || 'Anonymous').trim().slice(0, 50)}`;
  const body = [
    '## Hand',
    formatHandLabel(hand),
    handStr ? `**Cards:** ${handStr}` : '',
    '',
    '_Proposals are reviewed when issue reactions (e.g. 👍) reach 10k._',
    '',
    '_Submitted from Periodic Table Poker_',
  ].filter(Boolean).join('\n');
  const base = `https://github.com/${repo}/issues/new`;
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/** Build GitHub issue URL for Hall of Fame (scoreboard) submission */
function buildScoreboardIssueUrl(repo, displayName, stats, durationMs) {
  const formatHand = (h) =>
    h ? (formatHandLabel(h) + (h.cards?.length ? ` (${h.cards.map((c) => c.symbol).join(', ')})` : '')) : '—';
  const mins = Math.floor(durationMs / 60000);
  const secs = Math.floor((durationMs % 60000) / 1000);
  const durationStr = `${mins}m ${secs}s`;
  const title = `Hall of Fame: ${displayName || 'Anonymous'}`;
  const body = [
    '## Player',
    displayName || 'Anonymous',
    '',
    '## Best hand (game)',
    formatHand(stats.bestHand),
    '',
    '## Last hand',
    formatHand(stats.lastHand),
    '',
    '## Biggest single win',
    `${stats.biggestWin ?? 0} atomcoins`,
    '',
    '## Duration',
    durationStr,
    '',
    '---',
    '_Multiplayer game coming next._',
    '',
    '_Submitted from Periodic Table Poker_',
  ].join('\n');
  const base = `https://github.com/${repo}/issues/new`;
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

/** Seat positions around oval: 0 = bottom (player), dealer at top between H–He (above seat 4) */
const SEAT_POSITIONS = [
  { name: 'bottom', angle: 180 },   // 0 player
  { name: 'bottom-right', angle: 135 },
  { name: 'right', angle: 90 },
  { name: 'top-right', angle: 45 },
  { name: 'top', angle: 0 },        // dealer between H-He
  { name: 'top-left', angle: -45 },
  { name: 'left', angle: -90 },
  { name: 'bottom-left', angle: -135 },
  { name: 'left-mid', angle: -150 },
  { name: 'right-mid', angle: 150 },
];

export function GameBoard({
  session,
  gameOver,
  winner,
  guestName,
  gameName,
  onDealFlop,
  onDealTurn,
  onDealRiver,
  onShowdown,
  onNextHand,
  githubRepo,
}) {
  const [openCards, setOpenCards] = useState(false);
  const [scoreboardName, setScoreboardName] = useState('');

  if (!session) {
    return (
      <div className="game-board" data-testid="game-board">
        <p>No game in progress</p>
      </div>
    );
  }

  const { players, currentHand, handNumber, stats, startTime } = session;
  const phase = currentHand?.phase ?? 'preflop';
  const communityCards = currentHand?.communityCards ?? [];
  const pot = currentHand?.pot ?? 0;
  const isShowdown = phase === PHASES.SHOWDOWN;
  const humanWonAll = gameOver && winner?.id === 'player-0';

  const canDealFlop = phase === PHASES.PREFLOP && onDealFlop;
  const canDealTurn = phase === PHASES.FLOP && onDealTurn;
  const canDealRiver = phase === PHASES.TURN && onDealRiver;
  const canShowdown = phase === PHASES.RIVER && onShowdown;
  const canNextHand = isShowdown && !gameOver && onNextHand;

  const showBotCards = openCards || isShowdown;

  return (
    <div className="game-board game-board-table" data-testid="game-board">
      <p className="book-hint">If you want to know what that element is, open an actual book.</p>

      <div className="table-periodic">
        <div className="table-dealer" aria-hidden="true">D</div>

        <div className="table-community">
          <div className="community-cards">
            {communityCards.map((card, i) => (
              <Card key={card.id || i} element={card} />
            ))}
          </div>
          <div className="pot">Pot: {pot} atomcoins</div>
        </div>

        <div className="table-seats">
          {players.map((player) => {
            const pos = SEAT_POSITIONS[player.seatIndex] || SEAT_POSITIONS[0];
            const isHuman = player.id === 'player-0';
            const rank = getHandRank(player.holeCards, communityCards);
            const comboLabel =
              rank.combo === 'chonp' ? 'CHONP' : rank.combo === 'h2o' ? 'H₂O' : rank.combo === 'nacl' ? 'NaCl' : null;
            const faceUp = isHuman || showBotCards;
            return (
              <div
                key={player.id}
                className={`table-seat table-seat-${pos.name} ${player.eliminated ? 'eliminated' : ''} ${isHuman ? 'human' : ''}`}
                data-testid={`player-${player.id}`}
              >
                <div className={`seat-inner ${rank.combo ? 'player-flash' : ''}`}>
                  {comboLabel && <span className="player-combo-badge">{comboLabel}!</span>}
                  <div className="seat-name">{player.name}</div>
                  <div className="player-cards">
                    {player.holeCards?.map((card, i) => (
                      <Card key={card?.id || i} element={card} faceDown={!faceUp} />
                    ))}
                  </div>
                  {(openCards || isShowdown) ? (
                    <div className="player-best-hand">{formatHandLabel(rank)}</div>
                  ) : isHuman ? (
                    <div className="player-best-hand">Best hand: {formatHandLabel(rank)}</div>
                  ) : null}
                  <div className="player-chips">{player.chips} atomcoins</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="game-meta">
        Hand #{handNumber} · Total: {TOTAL_ATOMCOINS} atomcoins
        {githubRepo && (
          <a
            href={buildHierarchyIssueUrl(githubRepo, guestName, stats.bestHand || (players[0] && getHandRank(players[0].holeCards, communityCards)))}
            target="_blank"
            rel="noopener noreferrer"
            className="hierarchy-link"
            title="Reviewed when reactions reach 10k"
          >
            Propose hierarchy
          </a>
        )}
      </div>

      <label className="open-cards-toggle">
        <input
          type="checkbox"
          checked={openCards}
          onChange={(e) => setOpenCards(e.target.checked)}
        />
        Show all cards (open cards, no score)
      </label>

      <div className="game-actions">
        {canDealFlop && <button onClick={onDealFlop}>Deal Flop</button>}
        {canDealTurn && <button onClick={onDealTurn}>Deal Turn</button>}
        {canDealRiver && <button onClick={onDealRiver}>Deal River</button>}
        {canShowdown && <button className="btn-primary" onClick={onShowdown}>Showdown</button>}
        {canNextHand && <button className="btn-primary" onClick={onNextHand}>Next Hand</button>}
      </div>

      {gameOver && winner?.id === 'player-0' && (
        <div className="scoreboard-submit" data-testid="scoreboard-submit">
          <h3>You won 10,000 atomcoins!</h3>
          <p>Submit your name to the Hall of Fame (stays forever).</p>
          <div className="scoreboard-stats">
            <p><strong>Best hand:</strong> {formatHandLabel(stats.bestHand)}</p>
            <p><strong>Last hand:</strong> {formatHandLabel(stats.lastHand)}</p>
            <p><strong>Biggest win:</strong> {stats.biggestWin ?? 0} atomcoins</p>
            <p><strong>Duration:</strong> {Math.floor((Date.now() - startTime) / 60000)}m {Math.floor(((Date.now() - startTime) % 60000) / 1000)}s</p>
          </div>
          <input
            type="text"
            placeholder="Your name for the scoreboard"
            value={scoreboardName}
            onChange={(e) => setScoreboardName(e.target.value)}
            className="scoreboard-name-input"
          />
          <a
            href={buildScoreboardIssueUrl(
              githubRepo,
              scoreboardName.trim() || guestName,
              stats,
              Date.now() - startTime
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-scoreboard"
          >
            Submit to Hall of Fame
          </a>
          <p className="scoreboard-note">Multiplayer game coming next.</p>
        </div>
      )}

      {gameOver && winner?.id !== 'player-0' && (
        <div className="game-over-other">
          <h3>Game over</h3>
          <p>{winner?.name ?? 'A bot'} has all 10,000 atomcoins.</p>
        </div>
      )}
    </div>
  );
}
