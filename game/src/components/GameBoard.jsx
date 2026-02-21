import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { getBestHand, getMoleculeCombo } from '../game/gameLogic.js';

function buildHierarchyIssueUrl(repo, playerId, playerData, bestHand) {
  const { cards, weight } = bestHand;
  const handStr = cards.map((c) => `${c.symbol} (${c.mass ?? c.number}u)`).join(', ');
  const title = `Best hand: ${weight} u — ${playerData?.trim() || playerId}`;
  const body = [
    '## Player',
    playerData?.trim() || playerId,
    '',
    '## Best Hand',
    `**Weight:** ${weight} u`,
    `**Cards:** ${handStr}`,
    '',
    '_Submitted from Periodic Table Poker game_',
  ].join('\n');
  const base = `https://github.com/${repo}/issues/new`;
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

const HUMAN_INDEX = 0;
const DEALER_INDEX = 1; // Dealer "D" on opponent for first hand

export function GameBoard({ gameState, gameNumber, onDealFlop, onDealTurn, onDealRiver, onNextGame, githubRepo }) {
  if (!gameState) {
    return (
      <div className="game-board" data-testid="game-board">
        <p>No game in progress</p>
      </div>
    );
  }

  const { players, communityCards, phase, pot = 0 } = gameState;
  const canDealFlop = phase === 'preflop' && onDealFlop;
  const canDealTurn = phase === 'flop' && onDealTurn;
  const canDealRiver = phase === 'turn' && onDealRiver;
  const canNextGame = phase === 'river' && onNextGame;
  const canSubmitHierarchy = phase === 'river' && githubRepo;

  const [playerData, setPlayerData] = useState({});
  const setDataFor = (playerId, value) => setPlayerData((prev) => ({ ...prev, [playerId]: value }));

  const you = players?.[HUMAN_INDEX];
  const opponent = players?.[1];
  const displayNameYou = 'You';
  const displayNameOpponent = opponent?.id === 'player-1' ? 'Bot' : (opponent?.id ?? 'Opponent');

  const renderSeat = (player, seatClass, displayName, isDealer, showCardsOpen) => {
    if (!player) return null;
    const bestHand = getBestHand(player.holeCards, communityCards);
    const combo = getMoleculeCombo(player.holeCards, communityCards);
    const comboLabel = combo === 'chonp' ? 'CHONP' : combo === 'h2o' ? 'H₂O' : combo === 'nacl' ? 'NaCl' : null;
    const isYou = player.id === you?.id;
    return (
      <div key={player.id} className={`seat ${seatClass}`} data-testid={`player-${player.id}`}>
        <div className={`player-box ${combo ? 'player-flash' : ''}`} style={{ position: 'relative' }}>
          {isDealer && <span className="dealer-badge">D</span>}
          <div className="player-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="player-info">
            <span className="player-name">{displayName}</span>
            <span className="player-chips">{player.chips}</span>
          </div>
        </div>
        {comboLabel && <div className="player-combo-badge">{comboLabel}!</div>}
        <div className="player-cards">
          {player.holeCards?.map((card, i) => (
            <Card key={card.id || i} element={card} faceDown={!showCardsOpen && !isYou} />
          ))}
        </div>
        <div className="player-best-hand">Best hand: {bestHand.weight} u</div>
        {phase === 'river' && canSubmitHierarchy && isYou && (
          <div className="player-hierarchy">
            <input
              type="text"
              placeholder="Your name or note for the hierarchy..."
              value={playerData[player.id] ?? ''}
              onChange={(e) => setDataFor(player.id, e.target.value)}
              className="player-hierarchy-input"
              data-testid={`player-${player.id}-input`}
            />
            <a
              href={buildHierarchyIssueUrl(githubRepo, player.id, playerData[player.id], bestHand)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hierarchy"
              data-testid={`player-${player.id}-submit`}
            >
              Submit to Hierarchy
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="game-board poker-view" data-testid="game-board">
      {gameNumber === 3 && (
        <div className="chonp-yell-msg poker-view-msg" data-testid="chonp-yell-msg">Yell out CHONP!</div>
      )}
      <div className="poker-table-wrap">
        <div className="poker-table">
          <div className="table-center">
            <div className="total-pot">Total Pot {pot}</div>
            <div className="community-cards">
              {communityCards.map((card, i) => (
                <Card key={card.id || i} element={card} />
              ))}
            </div>
          </div>
          <div className="table-seats">
            {you && renderSeat(you, 'seat-you', displayNameYou, DEALER_INDEX === 0, true)}
            {opponent && renderSeat(opponent, 'seat-opponent', displayNameOpponent, DEALER_INDEX === 1, true)}
          </div>
        </div>
      </div>
      <div className="your-hand-bar">
        <span className="your-hand-label">Your Hand:</span>
        <div className="your-hand-cards">
          {you?.holeCards?.map((card, i) => (
            <Card key={card.id || i} element={card} />
          ))}
        </div>
        <div className="action-bar">
          {canDealFlop && <button className="btn-check" onClick={onDealFlop}>Deal Flop</button>}
          {canDealTurn && <button className="btn-check" onClick={onDealTurn}>Deal Turn</button>}
          {canDealRiver && <button className="btn-check" onClick={onDealRiver}>Deal River</button>}
          {canNextGame && <button className="btn-primary" onClick={onNextGame}>Next Game</button>}
          <button type="button" className="btn-add-chips" aria-label="Add chips">Add chips</button>
        </div>
      </div>
    </div>
  );
}
