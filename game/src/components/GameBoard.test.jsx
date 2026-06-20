import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    const badge = screen.getByTestId('combo-badge-h2o');
    expect(badge.getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Water');
  });

  it('shows known molecules panel with Wikipedia links and card hints', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'H' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    expect(screen.getByTestId('known-molecules-panel')).toBeTruthy();
    expect(screen.getByTestId('known-molecules-panel').textContent).toMatch(/one card per element/i);
    expect(screen.getByTestId('known-molecule-nacl').getAttribute('href')).toContain('Sodium_chloride');
    expect(screen.getByTestId('known-molecule-h2o').textContent).toContain('H + O');
    expect(screen.getByTestId('known-molecule-chonp').getAttribute('href')).toContain('DNA');
    expect(screen.getByTestId('known-molecule-co2').getAttribute('href')).toContain('Carbon_dioxide');
    expect(screen.getByTestId('known-molecule-co2').textContent).toContain('C + O');
    expect(screen.getByTestId('molecules-wiki-index').getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Lists_of_molecules');
  });

  it('rules panel explains one card per element and subscript shorthand', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'H' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(<GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />);
    const rules = screen.getByTestId('rules-panel');
    expect(rules.textContent).toContain('One card per element');
    expect(rules.textContent).toContain('CO₂ = C + O');
    expect(rules.textContent).toContain('CHONP → H₂O → NaCl → CO₂ → best mass');
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

  it('shows molecule scoreboard submit when human wins with CHONP at showdown (game 4+)', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'C' }, { symbol: 'H' }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 900, folded: false },
      ],
      communityCards: [
        { symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }, { mass: 1 }, { mass: 2 },
      ],
      phase: 'showdown',
      dealerIndex: 0,
      winnerIndex: 0,
      winnerReason: 'chonp',
    };
    render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
      />
    );
    expect(screen.getByTestId('molecule-scoreboard')).toBeTruthy();
    expect(screen.getByTestId('molecule-scoreboard-name')).toBeTruthy();
    expect(screen.getByTestId('molecule-scoreboard-submit')).toBeTruthy();
    expect(screen.getByTestId('view-scoreboard-link').getAttribute('href')).toBe('/scoreboard.html');
  });

  it('does not show molecule scoreboard when human wins with mass only', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 100 }, { mass: 90 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 1 }, { mass: 2 }], chips: 900, folded: false },
      ],
      communityCards: [{ mass: 80 }, { mass: 70 }, { mass: 60 }, { mass: 50 }, { mass: 10 }],
      phase: 'showdown',
      dealerIndex: 0,
      winnerIndex: 0,
      winnerReason: 'mass',
    };
    render(
      <GameBoard
        gameState={gameState}
        gameNumber={5}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={true}
      />
    );
    expect(screen.queryByTestId('molecule-scoreboard')).toBeFalsy();
  });

  it('does not show molecule scoreboard when human lost despite having NaCl', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 900, folded: false },
        { id: 'player-1', holeCards: [{ symbol: 'C' }, { symbol: 'H' }], chips: 1100, folded: false },
      ],
      communityCards: [
        { symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }, { mass: 1 }, { mass: 2 },
      ],
      phase: 'showdown',
      dealerIndex: 0,
      winnerIndex: 1,
      winnerReason: 'chonp',
    };
    render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
      />
    );
    expect(screen.queryByTestId('molecule-scoreboard')).toBeFalsy();
  });

  it('calls submitMoleculeScore when Submit is clicked', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 1 }, { mass: 2 }], chips: 900, folded: false },
      ],
      communityCards: [{ mass: 3 }, { mass: 4 }, { mass: 5 }, { mass: 6 }, { mass: 7 }],
      phase: 'showdown',
      dealerIndex: 0,
      winnerIndex: 0,
      winnerReason: 'nacl',
    };
    render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
        onSubmitMoleculeScore={submit}
      />
    );
    const input = screen.getByTestId('molecule-scoreboard-name');
    fireEvent.change(input, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByTestId('molecule-scoreboard-submit'));
    await waitFor(() => {
      expect(submit).toHaveBeenCalledWith({
        displayName: 'Alice',
        molecule: 'nacl',
        gameNumber: 4,
        handWeight: expect.any(Number),
      });
    });
  });

  it('shows community hierarchy in game 4+ with GitHub submit links', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ symbol: 'Fe', mass: 56 }, { symbol: 'Cu', mass: 64 }], chips: 1000, folded: false },
        { id: 'player-1', holeCards: [{ mass: 1 }], chips: 1000, folded: false },
      ],
      communityCards: [{ symbol: 'O', mass: 16 }, { symbol: 'N', mass: 14 }, { symbol: 'C', mass: 12 }],
      phase: 'flop',
      dealerIndex: 0,
      currentPlayerIndex: 0,
    };
    render(
      <GameBoard
        gameState={gameState}
        gameNumber={4}
        onPlayerAction={() => {}}
        onBotTurn={() => {}}
        onNextHand={() => {}}
        isGameOver={false}
        githubRepo="owner/repo"
      />
    );
    expect(screen.getByTestId('community-hierarchy')).toBeTruthy();
    expect(screen.getByTestId('life-first-reminder')).toBeTruthy();
    const handLink = screen.getByTestId('submit-hand-hierarchy');
    expect(handLink.href).toContain('github.com/owner/repo/issues/new');
    expect(decodeURIComponent(handLink.href)).toContain('Hierarchy proposal');
    expect(screen.getByTestId('propose-new-rule').href).toContain('issues/new');
    expect(screen.getByTestId('view-github-proposals').href).toBe('https://github.com/owner/repo/issues');
  });

  it('does not show community hierarchy in tutorial game 1', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'Na' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
    };
    render(
      <GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />
    );
    expect(screen.queryByTestId('community-hierarchy')).toBeFalsy();
  });

  it('hides community hierarchy when human folded', () => {
    const gameState = {
      players: [
        { id: 'player-0', holeCards: [{ mass: 1 }], chips: 900, folded: true },
        { id: 'player-1', holeCards: [{ mass: 2 }], chips: 1100, folded: false },
      ],
      communityCards: [{ mass: 3 }, { mass: 4 }, { mass: 5 }],
      phase: 'flop',
      dealerIndex: 0,
    };
    render(
      <GameBoard gameState={gameState} gameNumber={4} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />
    );
    expect(screen.queryByTestId('community-hierarchy')).toBeFalsy();
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

  it('shows molecule test banner when in molecule test mode', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'C' }, { symbol: 'H' }], chips: 1000, folded: false }],
      communityCards: [],
      phase: 'preflop',
      dealerIndex: 0,
      moleculeTest: true,
      moleculeTestIndex: 1,
      moleculeTestId: 'chonp',
    };
    render(
      <GameBoard gameState={gameState} gameNumber={1} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />
    );
    const banner = screen.getByTestId('molecule-test-banner');
    expect(banner.textContent).toContain('1/50');
    expect(banner.textContent).toContain('CHONP');
    expect(banner.textContent).toContain('C + H + O + N + P');
  });

  it('shows PASS at showdown when catalog molecule cards are present', () => {
    const gameState = {
      players: [{ id: 'player-0', holeCards: [{ symbol: 'H' }, { symbol: 'O' }], chips: 1000, folded: false }],
      communityCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }, { symbol: 'Au' }],
      phase: 'showdown',
      dealerIndex: 0,
      winnerIndex: 0,
      winnerReason: 'h2o',
      moleculeTest: true,
      moleculeTestIndex: 2,
      moleculeTestId: 'h2o',
    };
    render(
      <GameBoard gameState={gameState} gameNumber={2} onPlayerAction={() => {}} onBotTurn={() => {}} onNextHand={() => {}} isGameOver={false} />
    );
    expect(screen.getByTestId('molecule-test-result').textContent).toMatch(/^PASS/);
  });
});
