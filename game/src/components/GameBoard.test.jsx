import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard.jsx';

describe('GameBoard', () => {
  it('shows best hand weight below each player cards', () => {
    const gameState = {
      players: [
        {
          id: '1',
          holeCards: [{ mass: 12, symbol: 'C', number: 6 }, { mass: 16, symbol: 'S', number: 16 }],
          chips: 1000,
        },
        {
          id: '2',
          holeCards: [{ mass: 1, symbol: 'H', number: 1 }, { mass: 4, symbol: 'He', number: 2 }],
          chips: 1000,
        },
      ],
      communityCards: [],
      phase: 'preflop',
    };
    render(<GameBoard gameState={gameState} />);
    const bestHandElements = screen.getAllByText(/Best hand:/);
    expect(bestHandElements).toHaveLength(2);
    expect(bestHandElements[0].textContent).toBe('Best hand: 28 u');
    expect(bestHandElements[1].textContent).toBe('Best hand: 5 u');
  });

  it('computes best 5 from 7 cards for each player', () => {
    const gameState = {
      players: [
        {
          id: '1',
          holeCards: [{ mass: 100 }, { mass: 90 }],
          chips: 1000,
        },
      ],
      communityCards: [
        { mass: 80 },
        { mass: 70 },
        { mass: 60 },
        { mass: 50 },
        { mass: 10 },
      ],
      phase: 'river',
    };
    render(<GameBoard gameState={gameState} />);
    expect(screen.getByText(/Best hand: 400 u/)).toBeTruthy();
  });

  it('shows Next Game button when phase is river', () => {
    const onNextGame = vi.fn();
    const gameState = {
      players: [{ id: '1', holeCards: [{ mass: 1 }], chips: 1000 }],
      communityCards: [{ mass: 2 }, { mass: 3 }, { mass: 4 }, { mass: 5 }, { mass: 6 }],
      phase: 'river',
    };
    render(<GameBoard gameState={gameState} onNextGame={onNextGame} />);
    const btn = screen.getByRole('button', { name: /next game/i });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onNextGame).toHaveBeenCalledTimes(1);
  });

  it('shows molecule combo badge and flash when player has H and O', () => {
    const gameState = {
      players: [
        {
          id: '1',
          holeCards: [{ symbol: 'H' }, { symbol: 'X' }],
          chips: 1000,
        },
      ],
      communityCards: [{ symbol: 'O' }],
      phase: 'flop',
    };
    const { container } = render(<GameBoard gameState={gameState} />);
    expect(container.querySelector('.player-flash')).toBeTruthy();
    expect(screen.getByText('H₂O!')).toBeTruthy();
  });

  it('does not show Next Game button before river', () => {
    const gameState = {
      players: [{ id: '1', holeCards: [{ mass: 1 }], chips: 1000 }],
      communityCards: [],
      phase: 'preflop',
    };
    render(<GameBoard gameState={gameState} />);
    expect(screen.queryByRole('button', { name: /next game/i })).toBeFalsy();
  });

  it('shows "Yell out CHONP!" message in game 3', () => {
    const gameState = {
      players: [{ id: '1', holeCards: [{ symbol: 'C' }], chips: 1000 }],
      communityCards: [],
      phase: 'preflop',
    };
    render(<GameBoard gameState={gameState} gameNumber={3} />);
    expect(screen.getByTestId('chonp-yell-msg').textContent).toBe('Yell out CHONP!');
  });

  it('does not show CHONP message when not game 3', () => {
    const gameState = {
      players: [{ id: '1', holeCards: [{ symbol: 'C' }], chips: 1000 }],
      communityCards: [],
      phase: 'preflop',
    };
    render(<GameBoard gameState={gameState} gameNumber={1} />);
    expect(screen.queryByTestId('chonp-yell-msg')).toBeFalsy();
  });

  it('shows hierarchy text input and submit link when phase is river and githubRepo passed', () => {
    const gameState = {
      players: [
        { id: 'p1', holeCards: [{ mass: 12, symbol: 'C' }, { mass: 16, symbol: 'S' }], chips: 1000 },
      ],
      communityCards: [{ mass: 1, symbol: 'H' }],
      phase: 'river',
    };
    render(<GameBoard gameState={gameState} githubRepo="owner/repo" />);
    const input = screen.getByTestId('player-p1-input');
    expect(input).toBeTruthy();
    expect(input.placeholder).toContain('name or note');
    const link = screen.getByTestId('player-p1-submit');
    expect(link).toBeTruthy();
    expect(link.textContent).toBe('Submit to Hierarchy');
    expect(link.href).toContain('github.com/owner/repo/issues/new');
  });
});
