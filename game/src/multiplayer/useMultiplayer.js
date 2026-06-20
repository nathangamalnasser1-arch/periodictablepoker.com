import { useState, useEffect, useCallback, useRef } from 'react';
import { session, MIN_PLAYERS } from './core.js';
import { dealGame } from '../game/gameLogic.js';

export function useMultiplayer(onRemoteState) {
  const [mode, setMode] = useState('idle'); // idle | lobby | waiting | playing
  const [myPlayerIndex, setMyPlayerIndex] = useState(-1);
  const [numPlayers, setNumPlayers] = useState(2);
  const [lobbyData, setLobbyData] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState(null);
  const [waitingGames, setWaitingGames] = useState([]);
  const [waitingGamesLoading, setWaitingGamesLoading] = useState(false);
  const [openCards, setOpenCards] = useState(false);
  const unsubRef = useRef(null);
  const waitingUnsubRef = useRef(null);

  const stopWaitingList = useCallback(() => {
    waitingUnsubRef.current?.();
    waitingUnsubRef.current = null;
  }, []);

  const refreshWaitingGames = useCallback(async () => {
    setWaitingGamesLoading(true);
    setError(null);
    try {
      const games = await session.fetchWaiting();
      setWaitingGames(games);
    } catch (e) {
      setError(e.message);
    } finally {
      setWaitingGamesLoading(false);
    }
  }, []);

  const startWaitingList = useCallback(async () => {
    stopWaitingList();
    setWaitingGamesLoading(true);
    try {
      await session.ensureAuth();
      waitingUnsubRef.current = session.subscribeWaiting(games => {
        setWaitingGames(games);
        setWaitingGamesLoading(false);
      });
    } catch (e) {
      setError(e.message);
      setWaitingGamesLoading(false);
    }
  }, [stopWaitingList]);

  const handleState = useCallback((state, data) => {
    if (data?.numPlayers) setNumPlayers(data.numPlayers);
    if (data?.openCards != null) setOpenCards(!!data.openCards);
    setMode('playing');
    onRemoteState(state);
  }, [onRemoteState]);

  const handleStatus = useCallback((status, data) => {
    if (status === 'waiting') {
      setLobbyData(data);
      if (data?.openCards != null) setOpenCards(!!data.openCards);
    }
    if (status === 'gone') {
      setMode('lobby');
      setLobbyData(null);
      startWaitingList();
    }
  }, [startWaitingList]);

  const openLobby = useCallback(async () => {
    setError(null);
    setMode('lobby');
    await startWaitingList();
  }, [startWaitingList]);

  const create = useCallback(async (gameName, options = {}) => {
    setError(null);
    stopWaitingList();
    try {
      const { keyword: kw, playerIndex } = await session.create(gameName, options);
      setKeyword(kw);
      setMyPlayerIndex(playerIndex);
      setOpenCards(!!options.openCards);
      setMode('waiting');
      unsubRef.current = session.subscribe(handleState, handleStatus);
    } catch (e) { setError(e.message); }
  }, [handleState, handleStatus, stopWaitingList]);

  const joinByKeyword = useCallback(async (kw) => {
    setError(null);
    stopWaitingList();
    try {
      const { playerIndex } = await session.join(kw);
      setMyPlayerIndex(playerIndex);
      setMode('waiting');
      unsubRef.current = session.subscribe(handleState, handleStatus);
    } catch (e) { setError(e.message); }
  }, [handleState, handleStatus, stopWaitingList]);

  const startGame = useCallback(async () => {
    setError(null);
    try {
      const lobbyCount = (lobbyData?.playerIds ?? []).filter(Boolean).length;
      const playerCount = lobbyCount >= MIN_PLAYERS ? lobbyCount : numPlayers;
      const initialState = dealGame(playerCount, 4, undefined, null, null, false);
      await session.start(initialState);
    } catch (e) { setError(e.message); }
  }, [numPlayers, lobbyData]);

  const writeState = useCallback((state) => {
    session.write(state).catch(() => {});
  }, []);

  const leave = useCallback(async () => {
    stopWaitingList();
    await session.leave();
    unsubRef.current?.();
    unsubRef.current = null;
    setMode('idle');
    setMyPlayerIndex(-1);
    setLobbyData(null);
    setKeyword('');
    setWaitingGames([]);
    setOpenCards(false);
    setError(null);
  }, [stopWaitingList]);

  useEffect(() => () => {
    unsubRef.current?.();
    waitingUnsubRef.current?.();
  }, []);

  return {
    mode,
    myPlayerIndex,
    numPlayers,
    lobbyData,
    keyword,
    error,
    waitingGames,
    waitingGamesLoading,
    openLobby,
    refreshWaitingGames,
    create,
    joinByKeyword,
    startGame,
    writeState,
    leave,
    isHost: myPlayerIndex === 0,
    isMultiplayer: mode === 'playing',
    openCards,
    minPlayers: MIN_PLAYERS,
  };
}
