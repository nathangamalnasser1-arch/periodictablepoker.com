import React, { useState, useCallback } from 'react';
import { dealGame, dealFlop, dealTurn, dealRiver } from './game/gameLogic.js';
import { GameBoard } from './components/GameBoard.jsx';
import './App.css';

const GITHUB_REPO = 'nathangamalnasser1-arch/periodictablepoker.com';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [gameNumber, setGameNumber] = useState(0);

  const startGame = useCallback(() => {
    setGameKey((k) => k + 1);
    setGameNumber(1);
    setGameState(dealGame(10, 1));
  }, []);

  const handleDealFlop = useCallback(() => {
    setGameState((prev) => dealFlop(prev));
  }, []);

  const handleDealTurn = useCallback(() => {
    setGameState((prev) => dealTurn(prev));
  }, []);

  const handleDealRiver = useCallback(() => {
    setGameState((prev) => dealRiver(prev));
  }, []);

  const handleNextGame = useCallback(() => {
    setGameKey((k) => k + 1);
    setGameNumber((n) => {
      const next = n + 1;
      setGameState(dealGame(10, next));
      return next;
    });
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Texas Hold'em with 118 element cards</p>
      </header>
      <main>
        {!gameState ? (
          <div className="lobby">
            <button className="btn-primary" onClick={startGame}>
              Start Game
            </button>
          </div>
        ) : (
          <GameBoard
            key={gameKey}
            gameState={gameState}
            gameNumber={gameNumber}
            onDealFlop={handleDealFlop}
            onDealTurn={handleDealTurn}
            onDealRiver={handleDealRiver}
            onNextGame={handleNextGame}
            githubRepo={GITHUB_REPO}
          />
        )}
      </main>
    </div>
  );
}
