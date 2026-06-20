import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard.jsx';

describe('GameBoard', () => {
  it('shows best hand weight below each player cards', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 12, symbol: 'C', number: 6 }, { mass: 16, symbol: 'S', number: 16 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 1, symbol: 'H', number: 1 }, { mass: 4, symbol: 'He', number: 2 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const bestHandElements = screen.getAllByText(/Best hand:/);
    expect(bestHandElements).toHaveLength(2);
    expect(bestHandElements[0].textContent).toBe('Best hand: 28 u');
    expect(bestHandElements[1].textContent).toBe('Best hand: 5 u');
  });

  it('computes best 5 from 7 cards for each player', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 100 }, { mass: 90 }], chips: 1000, folded: false },
      ],
      communityCards: [
        { mass: 80 }, { mass: 70 }, { mass: 60 }, { mass: 50 }, { mass: 10 },
      ],
      phase: 'river',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.getByText(/Best hand: 400 u/)).toBeTruthy();
  });

  it('shows Next Hand button when phase is showdown', () => {
    const onNextHand = vi.fn();
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ mass: 1 }], chips: 1000, folded: false }],
      communityCards: [{ mass: 2 }, { mass: 3 }, { mass: 4 }, { mass: 5 }, { mass: 6 }],
      phase: 'showdown',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={onNextHand} isGameOver={false} />);
    const btn = screen.getByRole('button', { name: /next hand/i });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onNextHand).toHaveBeenCalledTimes(1);
  });

  it('shows molecule combo badge and flash when player has H and O', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'H' }, { symbol: 'X' }], chips: 1000, folded: false },
      ],
      communityCards: [{ symbol: 'O' }],
      phase: 'flop',
      dealerIndex: 0,
    };
    const { container } = render(<GameBoard gameState={gameState} gameNumber={2} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(container.querySelector('.player-flash')).toBeTruthy();
    expect(screen.getByText('H₂O!')).toBeTruthy();
  });

  it('does not show Next Hand button when not showdown', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ mass: 1 }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.queryByRole('button', { name: /next hand/i })).toBeFalsy();
  });

  it('shows "Yell out CHONP!" message in game 3', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'C' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={3} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.getByTestId('chonp-yell-msg').textContent).toBe('Yell out CHONP!');
  });

  it('does not show CHONP message when not game 3', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'C' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.queryByTestId('chonp-yell-msg')).toBeFalsy();
  });

  it('shows "sure to win" message when human has winning molecule in game 1 (NaCl)', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 1000, folded: false },
      ],
      communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
      phase: 'flop',
      pot: 20,
      currentBet: 10,
      roundBets: [0, 0],
      currentPlayerIndex: 0,
      dealerIndex: 1,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const msg = screen.getByTestId('sure-to-win-msg');
    expect(msg).toBeTruthy();
    expect(msg.textContent).toContain('NaCl');
    expect(msg.textContent).toContain('sure to win');
    expect(msg.textContent).toContain('all in');
  });

  it('shows "sure to win" message when human has H₂O in game 2', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'H' }, { symbol: 'O' }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'Fe' }], chips: 1000, folded: false },
      ],
      communityCards: [{ symbol: 'A' }, { symbol: 'B' }, { symbol: 'C' }],
      phase: 'flop',
      currentBet: 0,
      roundBets: [0, 0],
      currentPlayerIndex: 0,
      dealerIndex: 1,
    };
    render(<GameBoard gameState={gameState} gameNumber={2} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const msg = screen.getByTestId('sure-to-win-msg');
    expect(msg.textContent).toContain('H₂O');
  });

  it('does not show "sure to win" when human does not have winning molecule', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 1000, folded: false },
      ],
      communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
      phase: 'flop',
      currentBet: 10,
      roundBets: [0, 0],
      currentPlayerIndex: 0,
      dealerIndex: 1,
    };
    render(<GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.queryByTestId('sure-to-win-msg')).toBeFalsy();
  });

  it('displays check action in last-action message (You check)', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 1 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 2 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'flop',
      dealerIndex: 0,
      lastAction: { playerIndex: 0, action: 'check' },
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const msg = screen.getByTestId('last-action-msg');
    expect(msg.textContent).toContain('You');
    expect(msg.textContent).toContain('check');
  });

  it('shows "Your turn" on the human seat when it is their turn', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 1 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 2 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'flop',
      currentPlayerIndex: 0,
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.getByTestId('turn-label-0').textContent).toBe('Your turn');
  });

  it('shows "Bot 3\'s turn" on the bot seat when it is their turn', () => {
    const gameState = {
      players: Array.from({ length: 10 }, (_, i) => ({ id: `player-${i}`, holeCards: [{ mass: 1 }], chips: 1000, folded: false })),
      communityCards: [],
      phase: 'flop',
      currentPlayerIndex: 3,
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.getByTestId('turn-label-3').textContent).toBe("Bot 3's turn");
  });

  it('shows current-turn-tracker so you can track whose turn it is', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 1 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 2 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'flop',
      currentPlayerIndex: 1,
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const tracker = screen.getByTestId('current-turn-tracker');
    expect(tracker.textContent).toContain('Current turn');
    expect(tracker.textContent).toContain('Bot 1');
  });

  it('displays all-in no-action in last-action message when skipping all-in player', () => {
    const gameState = {
      players: Array.from({ length: 10 }, (_, i) => ({ id: `player-${i}`, holeCards: [{ mass: 1 }], chips: 1000, folded: false })),
      communityCards: [],
      phase: 'flop',
      dealerIndex: 0,
      lastAction: { playerIndex: 5, action: 'all-in' },
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const msg = screen.getByTestId('last-action-msg');
    expect(msg.textContent).toContain('Bot 5');
    expect(msg.textContent).toContain('all-in');
    expect(msg.textContent).toContain('no action');
  });

  it('displays check action in last-action message (Bot 3 check)', () => {
    const gameState = {
      players: Array.from({ length: 10 }, (_, i) => ({ id: `player-${i}`, holeCards: [{ mass: 1 }], chips: 1000, folded: false })),
      communityCards: [],
      phase: 'flop',
      dealerIndex: 0,
      lastAction: { playerIndex: 3, action: 'check' },
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const msg = screen.getByTestId('last-action-msg');
    expect(msg.textContent).toContain('Bot 3');
    expect(msg.textContent).toContain('check');
  });

  it('shows scoreboard submit when game over and human won', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 12, symbol: 'C' }, { mass: 16, symbol: 'S' }], chips: 1000, folded: false },
      ],
      communityCards: [{ mass: 1, symbol: 'H' }],
      phase: 'showdown',
      dealerIndex: 0,
      gameStartTime: Date.now() - 120000,
      sessionBestHand: 28,
      sessionBiggestPot: 500,
    };
    render(<GameBoard gameState={gameState} gameNumber={5} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={true} githubRepo="owner/repo" />);
    expect(screen.getByPlaceholderText(/name for scoreboard/i)).toBeTruthy();
    const link = screen.getByRole('link', { name: /submit to scoreboard/i });
    expect(link).toBeTruthy();
    expect(link.href).toContain('github.com/owner/repo/issues/new');
  });

  it('hides opponent hole cards in multiplayer when openCards is false', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'H', number: 1 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'O', number: 8 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
      currentPlayerIndex: 0,
    };
    const { container } = render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
        humanIndex={0}
        isMultiplayer
        openCards={false}
      />
    );
    expect(container.querySelectorAll('[data-testid="card-facedown"]').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Best hand:/)).toBeTruthy();
  });

  it('shows opponent hole cards in multiplayer when openCards is true', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'H', number: 1 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'O', number: 8 }], chips: 1000, folded: false },
      ],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
      currentPlayerIndex: 0,
    };
    const { container } = render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
        humanIndex={0}
        isMultiplayer
        openCards
      />
    );
    expect(container.querySelectorAll('[data-testid="card-facedown"]').length).toBe(0);
  });
});
