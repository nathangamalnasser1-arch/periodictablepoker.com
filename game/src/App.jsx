import React, { useState, useCallback } from 'react';
import {
  dealGame,
  playerAction,
  botAction,
  advanceBettingRound,
  autoAdvanceIdlePlayers,
  runOutBoardWhenLocked,
  isBettingRoundComplete,
  isGameOver,
} from './game/gameLogic.js';
import { GameBoard } from './components/GameBoard.jsx';
import { Lobby } from './multiplayer/Lobby.jsx';
import { useMultiplayer } from './multiplayer/useMultiplayer.js';
import './App.css';

const GITHUB_REPO = 'nathangamalnasser1-arch/periodictablepoker.com';
const HUMAN_INDEX = 0;

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [appMode, setAppMode] = useState('home'); // home | solo | online

  const applyRemoteState = useCallback((state) => {
    setGameState(state);
  }, []);

  const mp = useMultiplayer(applyRemoteState);

  // --- Solo ---

  const startSoloGame = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState(dealGame(5, 4, undefined, null, null, false));
    setAppMode('solo');
  }, []);

  // --- Shared action handlers (solo + multiplayer) ---

  const handlePlayerAction = useCallback((action, amount = 0) => {
    setGameState(prev => {
      const actorIndex = mp.isMultiplayer ? mp.myPlayerIndex : HUMAN_INDEX;
      let s = playerAction(prev, actorIndex, action, amount);
      if (s === prev) return prev; // rejected action (not our turn)
      if (isBettingRoundComplete(s)) {
        const runOut = runOutBoardWhenLocked(s, s.gameNumber);
        s = runOut !== s ? runOut : advanceBettingRound(s, s.gameNumber);
      }
      s = autoAdvanceIdlePlayers(s, s.gameNumber);
      if (mp.isMultiplayer) mp.writeState(s);
      return s;
    });
  }, [mp]);

  const handleAutoAdvance = useCallback(() => {
    setGameState(prev => {
      const s = autoAdvanceIdlePlayers(prev, prev.gameNumber);
      if (s === prev) return prev;
      if (mp.isMultiplayer) mp.writeState(s);
      return s;
    });
  }, [mp]);

  const handleBotTurn = useCallback(() => {
    setGameState(prev => {
      let s = autoAdvanceIdlePlayers(prev, prev.gameNumber);
      const current = s.players[s.currentPlayerIndex];
      if (current && !current.folded && current.chips > 0) {
        const bot = botAction(s, s.currentPlayerIndex);
        s = playerAction(s, s.currentPlayerIndex, bot.action, bot.amount);
        if (isBettingRoundComplete(s)) {
          const runOut = runOutBoardWhenLocked(s, s.gameNumber);
          s = runOut !== s ? runOut : advanceBettingRound(s, s.gameNumber);
        }
        s = autoAdvanceIdlePlayers(s, s.gameNumber);
      }
      return s;
    });
  }, []);

  const handleNextHand = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState(prev => {
      const gameEnded = isGameOver(prev);
      const nextNum = gameEnded ? 4 : (prev?.gameNumber ?? 0) + 1;
      const session = prev && !gameEnded ? {
        gameStartTime: prev.gameStartTime,
        sessionBestHand: prev.sessionBestHand,
        sessionBiggestPot: prev.sessionBiggestPot,
        botStyles: prev.botStyles,
        tutorial: prev.tutorial,
      } : null;
      const numP = mp.isMultiplayer ? mp.numPlayers : 5;
      const previousChips = (gameEnded || nextNum === 4) ? null : prev?.players?.map(p => p.chips) ?? null;
      const next = dealGame(numP, nextNum, undefined, session, previousChips);
      if (mp.isMultiplayer) mp.writeState(next);
      return next;
    });
  }, [mp]);

  const isLocalTest = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.search.includes('test=1'));

  const humanIndex = mp.isMultiplayer ? mp.myPlayerIndex : HUMAN_INDEX;
  const playerNames = mp.isMultiplayer
    ? (mp.lobbyData?.playerNames ?? null)
    : null;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (appMode === 'home') {
    return (
      <div className="app">
        {isLocalTest && (
          <div className="local-test-banner" data-testid="local-test-banner">
            Local test — not deployed. Run <code>npm run deploy</code> from <code>game/</code> when ready.
          </div>
        )}
        <header>
          <h1>Periodic Table Poker</h1>
          <p className="tagline">Texas Hold'em with 118 element cards — win all the chips</p>
        </header>
        <main>
          <div className="lobby">
            <button className="btn-primary" onClick={startSoloGame}>
              Play Solo
            </button>
            <button
              className="btn-secondary"
              onClick={() => { setAppMode('online'); mp.openLobby(); }}
            >
              Play Online
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── ONLINE LOBBY / WAITING ROOM ───────────────────────────────────────────
  if (appMode === 'online' && !mp.isMultiplayer) {
    return (
      <div className="app">
        <header>
          <h1>Periodic Table Poker</h1>
        </header>
        <main>
          <Lobby
            mp={mp}
            onSolo={() => { mp.leave(); setAppMode('home'); }}
          />
        </main>
      </div>
    );
  }

  // ── SOLO GAME (or multiplayer once game starts) ───────────────────────────
  return (
    <div className="app">
      {isLocalTest && (
        <div className="local-test-banner" data-testid="local-test-banner">
          Local test — not deployed.
        </div>
      )}
      <header>
        <h1>Periodic Table Poker</h1>
        <p className="tagline">Texas Hold'em with 118 element cards — win all the chips</p>
      </header>
      <main>
        {!gameState ? (
          <div className="lobby">
            <button className="btn-primary" onClick={startSoloGame}>
              Start Game
            </button>
          </div>
        ) : (
          <GameBoard
            key={gameKey}
            gameState={gameState}
            gameNumber={gameState.gameNumber ?? 1}
            onPlayerAction={handlePlayerAction}
            onBotTurn={mp.isMultiplayer ? handleAutoAdvance : handleBotTurn}
            onNextHand={mp.isMultiplayer && !mp.isHost ? null : handleNextHand}
            isGameOver={isGameOver(gameState)}
            githubRepo={GITHUB_REPO}
            humanIndex={humanIndex}
            isMultiplayer={mp.isMultiplayer}
            openCards={mp.openCards}
            playerNames={playerNames}
          />
        )}
      </main>
    </div>
  );
}
