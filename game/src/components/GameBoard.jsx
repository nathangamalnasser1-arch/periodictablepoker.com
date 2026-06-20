import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card.jsx';
import { getBestHand, getMoleculeCombo, getWinner, getMinOpenBet, getMinRaiseTo, STARTING_CHIPS } from '../game/gameLogic.js';

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

function buildScoreboardIssueUrl(repo, playerName, timeMs, bestHandWeight, lastHandWeight, biggestWin) {
  const timeStr = `${Math.floor(timeMs / 60000)}m ${Math.floor((timeMs % 60000) / 1000)}s`;
  const title = `Scoreboard: ${playerName?.trim() || 'Winner'} — ${timeStr}`;
  const body = [
    '## Winner',
    playerName?.trim() || 'Anonymous',
    '',
    '## Time',
    timeStr,
    '',
    '## Best hand (session)',
    `${bestHandWeight} u`,
    '',
    '## Last hand (winning)',
    `${lastHandWeight} u`,
    '',
    '## Biggest single pot won',
    `${biggestWin}`,
    '',
    '_Submitted from Periodic Table Poker — won all 10k coins_',
  ].join('\n');
  const base = `https://github.com/${repo}/issues/new`;
  return `${base}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

const HUMAN_INDEX = 0;
const NUM_PLAYERS = 5;
const HUMAN_TURN_SECONDS = 60;
const BOT_TURN_SAFETY_MS = 10000;

/** Seat positions around oval: index 0 = bottom (you), 1..9 = clockwise. Returns { left %, top %, isTop, infoSide } */
function getSeatPosition(seatIndex) {
  const angleDeg = -90 + (seatIndex * 360 / NUM_PLAYERS);
  const angleRad = (angleDeg * Math.PI) / 180;
  const radiusX = 42;
  const radiusY = 38;
  const left = 50 + radiusX * Math.cos(angleRad);
  const top = 50 + radiusY * Math.sin(angleRad);
  const isTop = top < 50;
  const infoSide = left < 50 ? 'left' : 'right';
  return { left, top, isTop, infoSide };
}

export function GameBoard({ gameState, gameNumber, onPlayerAction, onBotTurn, onNextHand, isGameOver, githubRepo, humanIndex = HUMAN_INDEX, isMultiplayer = false, openCards = false, playerNames = null }) {
  if (!gameState) {
    return (
      <div className="game-board" data-testid="game-board">
        <p>No game in progress</p>
      </div>
    );
  }

  const { players, communityCards, phase, pot = 0, pots = [], currentBet = 0, roundBets = [], currentPlayerIndex, dealerIndex, winnerIndex, winnerIndices, winnerReason, lastAction, tutorial } = gameState;
  const minOpenBet = getMinOpenBet();
  const minRaiseTo = getMinRaiseTo(gameState);
  const isShowdown = phase === 'showdown';
  const you = players?.[humanIndex];
  const toCall = you && !you.folded ? Math.max(0, currentBet - (roundBets[humanIndex] || 0)) : 0;
  const isYourTurn = !isShowdown && currentPlayerIndex === humanIndex && you && !you.folded && you.chips > 0;
  const currentBot = !isShowdown && currentPlayerIndex !== humanIndex ? players?.[currentPlayerIndex] : null;
  const isBotTurn = currentBot && !currentBot.folded && currentBot.chips > 0;
  const isBotTurnAllIn = currentBot && !currentBot.folded && currentBot.chips === 0;
  const youAllIn = you && !you.folded && you.chips === 0;
  const currentTurnPlayer =
    !isShowdown && currentPlayerIndex != null && players?.[currentPlayerIndex] && !players[currentPlayerIndex].folded
      ? (currentPlayerIndex === humanIndex ? 'You' : (playerNames?.[currentPlayerIndex] ?? (isMultiplayer ? `Player ${currentPlayerIndex}` : `Bot ${currentPlayerIndex}`)))
      : null;
  const currentTurnIsAllIn = currentTurnPlayer && players?.[currentPlayerIndex]?.chips === 0;

  const indices = (winnerIndices != null && winnerIndices.length) ? winnerIndices : (winnerIndex != null ? [winnerIndex] : []);
  const winnerNames = indices.map((idx) => {
    if (!players?.[idx]) return '';
    if (idx === humanIndex) return 'You';
    return playerNames?.[idx] ?? (isMultiplayer ? `Player ${idx}` : `Bot ${idx}`);
  }).filter(Boolean);
  const winnerName = winnerNames.length === 1 ? winnerNames[0] : winnerNames.length > 1 ? winnerNames.join(', ') : '';
  const isSplitPot = (indices.length > 1);
  const winnerReasonLabel = winnerReason === 'nacl' ? 'NaCl' : winnerReason === 'h2o' ? 'H₂O' : winnerReason === 'chonp' ? 'CHONP' : winnerReason === 'mass' ? 'best hand' : '';

  const yourCombo = you ? getMoleculeCombo(you.holeCards, communityCards) : null;
  const youHaveWinningMolecule =
    (gameNumber === 1 && yourCombo === 'nacl') ||
    (gameNumber === 2 && yourCombo === 'h2o') ||
    (gameNumber === 3 && yourCombo === 'chonp');
  const winningMoleculeLabel = gameNumber === 1 ? 'NaCl' : gameNumber === 2 ? 'H₂O' : gameNumber === 3 ? 'CHONP' : '';

  const showCardsOpen = isShowdown || !isMultiplayer || openCards;

  const [playerData, setPlayerData] = useState({});
  const setDataFor = (playerId, value) => setPlayerData((prev) => ({ ...prev, [playerId]: value }));
  const [flashingWinnerIndex, setFlashingWinnerIndex] = useState(null);
  const [playerTimeRemaining, setPlayerTimeRemaining] = useState(null);
  const riverAllInTriggered = useRef(false);
  const isRiverAllIn =
    phase === 'river' &&
    communityCards?.length === 5 &&
    players?.length > 0 &&
    players.filter((p) => !p.folded).every((p) => p.chips === 0);
  useEffect(() => {
    if (!isRiverAllIn || !onBotTurn || riverAllInTriggered.current) return;
    riverAllInTriggered.current = true;
    const t = setTimeout(onBotTurn, 100);
    return () => clearTimeout(t);
  }, [isRiverAllIn, onBotTurn]);
  useEffect(() => {
    if (phase !== 'river') riverAllInTriggered.current = false;
  }, [phase]);

  const showdownWinnerIndices = isShowdown && indices.length > 0 ? indices : [];
  useEffect(() => {
    if (showdownWinnerIndices.length > 0) {
      setFlashingWinnerIndex(showdownWinnerIndices[0]);
      const t = setTimeout(() => setFlashingWinnerIndex(null), 4500);
      return () => clearTimeout(t);
    }
    setFlashingWinnerIndex(null);
  }, [isShowdown, winnerIndex]);

  useEffect(() => {
    if (!isYourTurn) {
      setPlayerTimeRemaining(null);
      return;
    }
    setPlayerTimeRemaining(HUMAN_TURN_SECONDS);
    const interval = setInterval(() => {
      setPlayerTimeRemaining((prev) => (prev == null || prev <= 1 ? null : prev - 1));
    }, 1000);
    const timeout = setTimeout(() => onPlayerAction('fold'), HUMAN_TURN_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isYourTurn, currentPlayerIndex, onPlayerAction]);

  const needsAutoAdvance = !isShowdown && currentTurnIsAllIn;
  useEffect(() => {
    if (!onBotTurn || (!isBotTurn && !needsAutoAdvance)) return;
    const delay = needsAutoAdvance ? 0 : 600;
    const t = setTimeout(onBotTurn, delay);
    const safety = setTimeout(() => onBotTurn(), BOT_TURN_SAFETY_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(safety);
    };
  }, [isBotTurn, needsAutoAdvance, currentPlayerIndex, onBotTurn, isShowdown]);

  const lastHandWeight = you && isShowdown ? getBestHand(you.holeCards, communityCards).weight : 0;
  const timeMs = gameState.gameStartTime ? Date.now() - gameState.gameStartTime : 0;

  const renderSeat = (player, seatIndex, displayName, isDealer) => {
    if (!player) return null;
    const { left, top, isTop, infoSide } = getSeatPosition(seatIndex);
    const bestHand = getBestHand(player.holeCards, communityCards);
    const combo = getMoleculeCombo(player.holeCards, communityCards);
    const comboLabel = combo === 'chonp' ? 'CHONP' : combo === 'h2o' ? 'H₂O' : combo === 'nacl' ? 'NaCl' : null;
    const isYou = seatIndex === humanIndex;
    const showHandInfo = showCardsOpen || isYou;
    const isWinnerFlash = showdownWinnerIndices.includes(seatIndex) && flashingWinnerIndex != null;
    const folded = player.folded;
    const isCurrentTurn = !isShowdown && currentPlayerIndex === seatIndex && !folded;
    const turnLabel = isCurrentTurn ? (seatIndex === humanIndex ? 'Your turn' : `${displayName}'s turn`) : null;
    return (
      <div
        key={player.id}
        className={`seat seat-${seatIndex} ${isTop ? 'seat-top' : 'seat-bottom'} seat-info-${infoSide} ${isWinnerFlash ? 'winner-flash' : ''} ${folded ? 'seat-folded' : ''} ${isCurrentTurn ? 'seat-current-turn' : ''}`}
        data-testid={`player-${player.id}`}
        style={{ left: `${left}%`, top: `${top}%` }}
      >
        <div className="seat-content">
          <div className="seat-info">
            <div className={`player-box ${combo && !folded ? 'player-flash' : ''}`} style={{ position: 'relative' }}>
              {isDealer && <span className="dealer-badge">D</span>}
              <div className="player-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
              <div className="player-info">
                <span className="player-name" title={displayName}>{displayName}</span>
                <span className="player-chips">{player.chips}</span>
              </div>
            </div>
            {turnLabel && <div className="player-turn-label" data-testid={`turn-label-${seatIndex}`}>{turnLabel}</div>}
            {folded && <div className="player-folded-label">Folded</div>}
            {!folded && player.chips === 0 && (
              <div className="player-allin-label" data-testid={`player-allin-${player.id}`}>
                {isShowdown && isGameOver ? 'Busted' : 'All-in'}
              </div>
            )}
            {comboLabel && !folded && <div className="player-combo-badge">{comboLabel}!</div>}
            {!folded && showHandInfo && <div className="player-best-hand">Best hand: {bestHand.weight} u</div>}
            {isShowdown && isGameOver && isYou && you.chips > 0 && (
              <div className="player-scoreboard">
                <input
                  type="text"
                  placeholder="Your name for scoreboard"
                  value={playerData.scoreboardName ?? ''}
                  onChange={(e) => setDataFor('scoreboardName', e.target.value)}
                  className="player-hierarchy-input"
                />
                <a
                  href={buildScoreboardIssueUrl(githubRepo, playerData.scoreboardName, timeMs, gameState.sessionBestHand || 0, lastHandWeight, gameState.sessionBiggestPot || 0)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hierarchy"
                >
                  Submit to Scoreboard
                </a>
              </div>
            )}
          </div>
          <div className="seat-cards">
            <div className="player-cards">
              {player.holeCards?.map((card, i) => (
                <Card key={card.id || i} element={card} faceDown={!showCardsOpen && !isYou} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="game-board poker-view" data-testid="game-board">
      {gameNumber === 3 && (
        <div className="chonp-yell-msg poker-view-msg" data-testid="chonp-yell-msg">Yell out CHONP!</div>
      )}
      {isRiverAllIn && !isShowdown && (
        <div className="resolving-showdown-msg" data-testid="resolving-showdown-msg">
          All-in — resolving showdown…
        </div>
      )}
      {isShowdown && winnerName && winnerReasonLabel && (
        <div className="showdown-winner-block" data-testid="showdown-winner-block">
          <div className={`winner-announce ${gameNumber === 3 && winnerReason === 'chonp' ? 'winner-announce-chonp' : ''}`} data-testid="winner-announce">
            {gameNumber === 3 && winnerReason === 'chonp' ? (
              <>CHONP wins! (atoms of DNA — proof of life) Winner: {winnerName} — flashing</>
            ) : isSplitPot ? (
              <>Winners: {winnerName} (split pot — {winnerReasonLabel})!</>
            ) : (
              <>Winner: {winnerName} ({winnerReasonLabel})!</>
            )}
          </div>
          <p className="showdown-next-hint">
            {isGameOver ? 'Game over — click New Game to play again.' : 'Click the button below to play the next hand.'}
          </p>
          {isGameOver && gameNumber >= 4 && (
            <p className="session-over-msg" data-testid="session-over-msg">
              {you?.chips === 0
                ? 'You are out of atomcoins.'
                : `${winnerName || 'You'} win${winnerName && winnerName !== 'You' ? 's' : ''} the game!`}
            </p>
          )}
          <div className="showdown-cta">
            {onNextHand ? (
              <button type="button" className="btn-primary btn-showdown-next" onClick={onNextHand} data-testid="showdown-next-btn">
                {isGameOver ? 'New Game' : 'Next Hand'}
              </button>
            ) : (
              <span className="waiting-msg" data-testid="showdown-next-btn">Waiting for host to deal next hand…</span>
            )}
          </div>
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 1 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-1">
          <strong>Tutorial Game 1 complete!</strong> NaCl (sodium chloride) is one of the three best molecule hands. The winner took the pot. Click <strong>Next Hand</strong> for Game 2 — H₂O.
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 2 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-2">
          <strong>Tutorial Game 2 complete!</strong> H₂O (water) is the <strong>second-best</strong> molecule hand. Click <strong>Next Hand</strong> for Game 3 — CHONP (the best hand).
        </div>
      )}
      {tutorial && isShowdown && gameNumber === 3 && winnerName && (
        <div className="tutorial-instruction" data-testid="tutorial-instruction-3">
          <strong>Tutorial Game 3 complete!</strong> CHONP (carbon, hydrogen, oxygen, nitrogen, phosphorus) are the atoms of DNA — rare in the universe and proof of life, so CHONP is the <strong>best hand</strong>. Best to third-best: CHONP → H₂O → NaCl. Click <strong>Next Hand</strong> to start the real game with 1000 chips each.
        </div>
      )}
      {gameNumber === 4 && (
        <div className="real-game-msg poker-view-msg" data-testid="real-game-msg">
          The real game starts — 1000 atomcoins redistributed!
        </div>
      )}
      <div className="rules-panel" data-testid="rules-panel">
        <strong>Rules so far:</strong> Same hand ranking every hand: best = CHONP (C, H, O, N, P — atoms of DNA, proof of life), then H₂O, then NaCl, then highest sum of atomic mass of your best 5 cards. (Tutorial hands 1–3 just show NaCl, then H₂O, then CHONP in order.) <strong>All-in:</strong> If you or a bot goes all-in, that player cannot fold and stays in until showdown; others must call (or go all-in) to stay in or fold. When everyone still in is all-in, no further bets — remaining community cards are dealt, then showdown. {gameNumber >= 4 && (<><strong>Bust:</strong> Once a player has 0 atomcoins after a hand, they lose and the game is over.</>)}
      </div>
      <div className="poker-table-wrap">
        <div className="poker-table">
          <div className="table-center">
            <div className="total-pot">
              Total Pot {pot}
              {pots.length > 1 && (
                <span className="side-pots" data-testid="side-pots">
                  {' '}
                  ({pots.map((p, i) => `${i === 0 ? 'Main' : 'Side'} ${p.amount}`).join(' · ')})
                </span>
              )}
            </div>
            <div className="community-cards">
              {communityCards.map((card, i) => (
                <Card key={card.id || i} element={card} />
              ))}
            </div>
          </div>
          <div className="table-seats">
            {players?.map((player, i) => {
              const displayName = i === humanIndex ? 'You' : (playerNames?.[i] ?? (isMultiplayer ? `Player ${i}` : `Bot ${i}`));
              return renderSeat(player, i, displayName, i === dealerIndex);
            })}
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
        {lastAction && (
          <span className="last-action-msg" data-testid="last-action-msg">
            {lastAction.playerIndex === humanIndex ? 'You' : (playerNames?.[lastAction.playerIndex] ?? (isMultiplayer ? `Player ${lastAction.playerIndex}` : `Bot ${lastAction.playerIndex}`))}
            {lastAction.action === 'all-in' ? ' (all-in — no action)' : ` ${lastAction.action}${lastAction.amount != null ? ` ${lastAction.amount}` : ''}`}
          </span>
        )}
        {isYourTurn && youHaveWinningMolecule && (
          <div className="sure-to-win-msg" data-testid="sure-to-win-msg">
            You have {winningMoleculeLabel} — you&apos;re sure to win this hand! Consider going all in.
          </div>
        )}
        {currentTurnPlayer && (
          <div className="current-turn-tracker" data-testid="current-turn-tracker">
            <strong>Current turn:</strong> {currentTurnPlayer}
            {currentTurnIsAllIn ? ' (all-in — no action)' : isYourTurn ? ' — check, bet, call or fold' : ' — checking…'}
          </div>
        )}
        <div className="action-bar">
          {isShowdown && onNextHand && (
            <button type="button" className="btn-primary" onClick={onNextHand}>
              {isGameOver ? 'New Game' : 'Next Hand'}
            </button>
          )}
          {isYourTurn && (
            <>
              {playerTimeRemaining != null && (
                <span className="turn-countdown" data-testid="turn-countdown">
                  {Math.floor(playerTimeRemaining / 60)}:{(playerTimeRemaining % 60).toString().padStart(2, '0')} or fold
                </span>
              )}
              <span className="to-call">To call: {toCall}</span>
              {toCall <= 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('check')}>Check</button>
              )}
              {toCall > 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('call')}>Call {Math.min(toCall, you.chips)}</button>
              )}
              {toCall <= 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('bet', minOpenBet)}>Bet {minOpenBet}</button>
              )}
              {toCall > 0 && (
                <button type="button" className="btn-check" onClick={() => onPlayerAction('raise', minRaiseTo)}>Raise to {minRaiseTo}</button>
              )}
              {you.chips > 0 && (
                <button type="button" className="btn-allin" onClick={() => onPlayerAction(toCall > 0 ? 'raise' : 'bet', (roundBets[humanIndex] || 0) + you.chips)}>
                  All in ({you.chips})
                </button>
              )}
              <button type="button" className="btn-fold" onClick={() => onPlayerAction('fold')}>Fold</button>
            </>
          )}
          {!isYourTurn && !isShowdown && isBotTurn && !isMultiplayer && <span className="waiting-msg">Bot thinking…</span>}
          {!isYourTurn && !isShowdown && isMultiplayer && currentTurnPlayer && !isBotTurn && !isBotTurnAllIn && (
            <span className="waiting-msg">Waiting for {currentTurnPlayer}…</span>
          )}
          {!isShowdown && youAllIn && (
            <span className="allin-msg" data-testid="allin-msg">All-in — you stay in until showdown. No action needed.</span>
          )}
        </div>
      </div>
    </div>
  );
}
