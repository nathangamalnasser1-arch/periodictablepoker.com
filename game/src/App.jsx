import React, { useState, useCallback, useEffect } from 'react';
import {
  dealGame,
  dealMoleculeTestGame,
  MOLECULE_CATALOG_COUNT,
  playerAction,
  botAction,
  isGameOver,
} from './game/gameLogic.js';
import { resolveGameProgress, processTurnWatchdog, ensureTurnStamp, WATCHDOG_INTERVAL_MS } from './game/turnTimeout.js';
import { GameBoard } from './components/GameBoard.jsx';
import { HomePage } from './components/HomePage.jsx';
import { Lobby } from './multiplayer/Lobby.jsx';
import { useMultiplayer } from './multiplayer/useMultiplayer.js';
import { isLocalTestWindow } from './utils/localTest.js';

import './App.css';

const GITHUB_REPO = 'nathangamalnasser1-arch/periodictablepoker.com';
const HUMAN_INDEX = 0;

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [appMode, setAppMode] = useState('home'); // home | solo | online

  const applyRemoteState = useCallback((state) => {
    setGameState(ensureTurnStamp(state));
  }, []);

  const mp = useMultiplayer(applyRemoteState);

  // --- Solo ---

  const startSoloGame = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState(dealGame(5, 4, undefined, null, null, false));
    setAppMode('solo');
  }, []);

  const startMoleculeTest = useCallback(() => {
    setGameKey((k) => k + 1);
    setGameState(dealMoleculeTestGame({ catalogIndex: 1, numPlayers: 5 }));
    setAppMode('solo');
  }, []);

  // --- Shared action handlers (solo + multiplayer) ---

  const handlePlayerAction = useCallback((action, amount = 0) => {
    setGameState(prev => {
      const actorIndex = mp.isMultiplayer ? mp.myPlayerIndex : HUMAN_INDEX;
      let s = playerAction(prev, actorIndex, action, amount);
      if (s === prev) return prev;
      s = resolveGameProgress(s, s.gameNumber);
      if (mp.isMultiplayer) mp.writeState(s);
      return s;
    });
  }, [mp]);

  const handleAutoAdvance = useCallback(() => {
    setGameState(prev => {
      const s = resolveGameProgress(prev, prev.gameNumber);
      if (s === prev) return prev;
      if (mp.isMultiplayer) mp.writeState(s);
      return s;
    });
  }, [mp]);

  const handleBotTurn = useCallback(() => {
    setGameState(prev => {
      let s = resolveGameProgress(prev, prev.gameNumber);
      const current = s.players[s.currentPlayerIndex];
      if (current && !current.folded && current.chips > 0 && s.phase !== 'showdown') {
        const bot = botAction(s, s.currentPlayerIndex);
        s = playerAction(s, s.currentPlayerIndex, bot.action, bot.amount);
        if (s !== prev) {
          s = resolveGameProgress(s, s.gameNumber);
        }
      }
      return s;
    });
  }, []);

  const handleNextHand = useCallback(() => {
    setGameKey(k => k + 1);
    setGameState(prev => {
      if (prev?.moleculeTestComplete) {
        setAppMode('home');
        return null;
      }
      if (prev?.moleculeTest) {
        const nextIndex = (prev.moleculeTestIndex ?? 0) + 1;
        if (nextIndex > MOLECULE_CATALOG_COUNT) {
          return { ...prev, moleculeTestComplete: true, phase: 'showdown' };
        }
        return dealMoleculeTestGame({ catalogIndex: nextIndex, numPlayers: prev.players?.length ?? 5 });
      }
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

  const isLocalTest = isLocalTestWindow();

  // Multiplayer host: fold/check absent players when turn timer expires
  const watchdogKey = gameState
    ? `${gameState.phase}-${gameState.currentPlayerIndex}-${gameState.turnStartedAt}`
    : null;
  useEffect(() => {
    if (!mp.isMultiplayer || !mp.isHost || !gameState || gameState.phase === 'showdown') return undefined;
    const id = setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.phase === 'showdown') return prev;
        const { state: next, timedOut } = processTurnWatchdog(prev, prev.gameNumber);
        if (next === prev) return prev;
        mp.writeState(next);
        return next;
      });
    }, WATCHDOG_INTERVAL_MS);
    return () => clearInterval(id);
  }, [mp.isMultiplayer, mp.isHost, mp.writeState, watchdogKey]);

  const humanIndex = mp.isMultiplayer ? mp.myPlayerIndex : HUMAN_INDEX;
  const playerNames = mp.isMultiplayer
    ? (mp.lobbyData?.playerNames ?? null)
    : null;

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (appMode === 'home') {
    return (
      <HomePage
        isLocalTest={isLocalTest}
        localTestBanner={isLocalTest && (
          <div className="local-test-banner" data-testid="local-test-banner">
            {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? (
                <>Local dev — run <code>npm run deploy</code> from <code>game/</code> to update the live site.</>
              )
              : (
                <>Dev mode (<code>?test=1</code>) — use <strong>Test all 50 molecules</strong> below.</>
              )}
          </div>
        )}
        onPlaySolo={startSoloGame}
        onPlayOnline={() => { setAppMode('online'); mp.openLobby(); }}
        onMoleculeTest={startMoleculeTest}
        githubRepo={GITHUB_REPO}
      />
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
