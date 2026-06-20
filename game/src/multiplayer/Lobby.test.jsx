import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Lobby } from './Lobby.jsx';

function makeMp(overrides = {}) {
  return {
    mode: 'lobby',
    lobbyData: null,
    keyword: '',
    error: null,
    waitingGames: [],
    waitingGamesLoading: false,
    minPlayers: 2,
    isHost: false,
    openLobby: vi.fn(),
    refreshWaitingGames: vi.fn(),
    create: vi.fn(),
    joinByKeyword: vi.fn(),
    startGame: vi.fn(),
    leave: vi.fn(),
    ...overrides,
  };
}

describe('Lobby open games list', () => {
  it('shows empty message when no open games', () => {
    render(<Lobby mp={makeMp()} onSolo={() => {}} />);
    expect(screen.getByTestId('open-games-empty')).toBeTruthy();
    expect(screen.getByText(/No open games right now/)).toBeTruthy();
  });

  it('lists joinable games with name, keyword, and Join button', () => {
    const mp = makeMp({
      waitingGames: [
        {
          id: 'g1',
          name: 'Friday Night',
          keyword: 'friday-night',
          playerIds: ['host-uid', null, null, null, null],
          playerNames: ['Player-1234', null, null, null, null],
        },
      ],
    });
    render(<Lobby mp={mp} onSolo={() => {}} />);
    expect(screen.getByTestId('open-games-list')).toBeTruthy();
    expect(screen.getByText('Friday Night')).toBeTruthy();
    expect(screen.getByText(/friday-night/)).toBeTruthy();
    expect(screen.getByTestId('join-game-g1')).toBeTruthy();
  });

  it('shows refresh button in open games section', () => {
    render(<Lobby mp={makeMp()} onSolo={() => {}} />);
    expect(screen.getByTestId('refresh-open-games')).toBeTruthy();
  });

  it('shows open cards checkbox when creating a game', () => {
    render(<Lobby mp={makeMp()} onSolo={() => {}} />);
    expect(screen.getByTestId('open-cards-option')).toBeTruthy();
    expect(screen.getByText(/Open cards/)).toBeTruthy();
  });

  it('shows open cards badge in waiting room when enabled', () => {
    const mp = makeMp({
      mode: 'waiting',
      keyword: 'test-room',
      openCards: true,
      lobbyData: {
        playerIds: ['a', 'b', null, null, null],
        playerNames: ['Host', 'Guest', null, null, null],
      },
      isHost: true,
    });
    render(<Lobby mp={mp} onSolo={() => {}} />);
    expect(screen.getByTestId('open-cards-badge')).toBeTruthy();
  });
});
