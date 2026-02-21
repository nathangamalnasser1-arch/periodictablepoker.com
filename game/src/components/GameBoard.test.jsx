/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard.jsx';

function sessionWith(overrides = {}) {
  return {
    players: [
      { id: 'player-0', seatIndex: 0, name: 'You', holeCards: [], chips: 1000, folded: false, isBot: false, eliminated: false },
      { id: 'player-1', seatIndex: 1, name: 'Bot 1', holeCards: [], chips: 1000, folded: false, isBot: true, eliminated: false },
    ],
    handNumber: 1,
    startTime: Date.now(),
    stats: { bestHand: null, lastHand: null, biggestWin: 0 },
    currentHand: {
      phase: 'preflop',
      communityCards: [],
      pot: 0,
    },
    ...overrides,
  };
}

describe('GameBoard', () => {
  it('shows best hand weight for human player when cards visible', () => {
    const session = sessionWith({
      players: [
        {
          id: 'player-0',
          seatIndex: 0,
          name: 'You',
          holeCards: [{ mass: 12, symbol: 'C', number: 6 }, { mass: 16, symbol: 'S', number: 16 }],
          chips: 1000,
          folded: false,
          isBot: false,
          eliminated: false,
        },
        {
          id: 'player-1',
          seatIndex: 1,
          name: 'Bot 1',
          holeCards: [{ mass: 1 }, { mass: 4 }],
          chips: 1000,
          folded: false,
          isBot: true,
          eliminated: false,
        },
      ],
      currentHand: { phase: 'preflop', communityCards: [], pot: 0 },
    });
    render(<GameBoard session={session} />);
    expect(screen.getByText(/Best hand: 28 u/)).toBeTruthy();
  });

  it('shows Showdown button when phase is river', () => {
    const onShowdown = vi.fn();
    const session = sessionWith({
      players: [
        { id: 'player-0', seatIndex: 0, name: 'You', holeCards: [{ mass: 1 }, { mass: 2 }], chips: 1000, folded: false, isBot: false, eliminated: false },
        { id: 'player-1', seatIndex: 1, name: 'Bot 1', holeCards: [], chips: 1000, folded: false, isBot: true, eliminated: false },
      ],
      currentHand: {
        phase: 'river',
        communityCards: [{ mass: 3 }, { mass: 4 }, { mass: 5 }, { mass: 6 }, { mass: 7 }],
        pot: 100,
      },
    });
    render(<GameBoard session={session} onShowdown={onShowdown} />);
    const btn = screen.getByRole('button', { name: /showdown/i });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onShowdown).toHaveBeenCalledTimes(1);
  });

  it('shows Next Hand button after showdown when not game over', () => {
    const onNextHand = vi.fn();
    const session = sessionWith({
      currentHand: { phase: 'showdown', communityCards: [], pot: 0 },
    });
    render(
      <GameBoard
        session={session}
        gameOver={false}
        onNextHand={onNextHand}
      />
    );
    const btn = screen.getByRole('button', { name: /next hand/i });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onNextHand).toHaveBeenCalledTimes(1);
  });

  it('shows molecule combo badge when player has H and O', () => {
    const session = sessionWith({
      players: [
        {
          id: 'player-0',
          seatIndex: 0,
          name: 'You',
          holeCards: [{ symbol: 'H' }, { symbol: 'X' }],
          chips: 1000,
          folded: false,
          isBot: false,
          eliminated: false,
        },
        { id: 'player-1', seatIndex: 1, name: 'Bot 1', holeCards: [], chips: 1000, folded: false, isBot: true, eliminated: false },
      ],
      currentHand: { phase: 'flop', communityCards: [{ symbol: 'O' }], pot: 0 },
    });
    const { container } = render(<GameBoard session={session} />);
    expect(container.querySelector('.player-flash')).toBeTruthy();
    expect(screen.getByText('H₂O!')).toBeTruthy();
  });

  it('shows Deal Flop when phase is preflop', () => {
    const onDealFlop = vi.fn();
    const session = sessionWith({ currentHand: { phase: 'preflop', communityCards: [], pot: 50 } });
    render(<GameBoard session={session} onDealFlop={onDealFlop} />);
    const btn = screen.getByRole('button', { name: /deal flop/i });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onDealFlop).toHaveBeenCalledTimes(1);
  });

  it('shows scoreboard submit when game over and human won', () => {
    const session = sessionWith({
      stats: { bestHand: { weight: 100, cards: [] }, lastHand: { weight: 90, cards: [] }, biggestWin: 500 },
      startTime: Date.now() - 120000,
    });
    render(
      <GameBoard
        session={session}
        gameOver={true}
        winner={{ id: 'player-0', name: 'You' }}
        guestName="guest-123"
        githubRepo="owner/repo"
      />
    );
    expect(screen.getByTestId('scoreboard-submit')).toBeTruthy();
    expect(screen.getByPlaceholderText(/name for the scoreboard/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /submit to hall of fame/i });
    expect(link).toBeTruthy();
    expect(link.href).toContain('github.com/owner/repo/issues/new');
  });

  it('shows book hint', () => {
    const { container } = render(<GameBoard session={sessionWith()} />);
    const hints = container.querySelectorAll('.book-hint');
    expect(hints.length).toBeGreaterThanOrEqual(1);
    expect(hints[0].textContent).toMatch(/open an actual book/i);
  });
});
