import React, { useState, useCallback } from 'react';
import {
  createSession,
  dealHand,
  dealFlopSession,
  dealTurnSession,
  dealRiverSession,
  endHand,
} from './game/gameLogic.js';
import { GameBoard } from './components/GameBoard.jsx';
import './App.css';

const GITHUB_REPO = 'nathangamalnasser1-arch/periodictablepoker.com';

function randomId() {
  return Math.floor(100000 + Math.random() * 899999);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [guestName] = useState(() => `guest-${randomId()}`);
  const [gameName] = useState(() => `game-${randomId()}`);

  const startGame = useCallback(() => {
    const s = createSession(guestName, gameName);
    const withHand = dealHand(s);
    setSession(withHand);
    setGameOver(false);
    setWinner(null);
  }, [guestName, gameName]);

  const handleDealFlop = useCallback(() => {
    setSession((prev) => (prev ? dealFlopSession(prev) : prev));
  }, []);

  const handleDealTurn = useCallback(() => {
    setSession((prev) => (prev ? dealTurnSession(prev) : prev));
  }, []);

  const handleDealRiver = useCallback(() => {
    setSession((prev) => (prev ? dealRiverSession(prev) : prev));
  }, []);

  const handleShowdown = useCallback(() => {
    if (!session) return;
    const { session: newSession, gameOver: over, winner: w } = endHand(session);
    setSession(newSession);
    setGameOver(over);
    setWinner(w || null);
  }, [session]);

  const handleNextHand = useCallback(() => {
    if (!session) return;
    const next = dealHand(session);
    setSession(next);
    setGameOver(false);
    setWinner(null);
  }, [session]);

  return (
    <div className="app">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Texas Hold'em with 118 element cards · 10,000 atomcoins</p>
        {session && (
          <p className="guest-game-names">
            {guestName} · {gameName}
          </p>
        )}
      </header>
      <main>
        {!session ? (
          <div className="lobby">
            <p className="lobby-names">Playing as {guestName} in {gameName}</p>
            <button className="btn-primary" onClick={startGame}>
              Start Game
            </button>
          </div>
        ) : (
          <GameBoard
            session={session}
            gameOver={gameOver}
            winner={winner}
            guestName={guestName}
            gameName={gameName}
            onDealFlop={handleDealFlop}
            onDealTurn={handleDealTurn}
            onDealRiver={handleDealRiver}
            onShowdown={handleShowdown}
            onNextHand={handleNextHand}
            githubRepo={GITHUB_REPO}
          />
        )}
      </main>
    </div>
  );
}
