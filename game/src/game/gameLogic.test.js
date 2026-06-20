import { describe, it, expect } from 'vitest';
import { dealGame, dealFlop, dealTurn, dealRiver, advanceBettingRound, advanceIfCurrentPlayerInvalid, autoAdvanceIdlePlayers, runOutBoardWhenLocked, isRunOutLocked, isGameOver, getSessionWinnerIndex, playerAction, isBettingRoundComplete, buildSidePots, getMinOpenBet, getMinRaiseTo, getBestHandWeight, getBestHand, getMoleculeCombo, getWinner, botAction, PHASES, BB, STARTING_CHIPS } from './gameLogic.js';

describe('gameLogic', () => {
  it('dealGame creates 2 players with 2 hole cards each (blinds posted)', () => {
    const game = dealGame(2, 1);
    expect(game.players).toHaveLength(2);
    game.players.forEach((p) => {
      expect(p.holeCards).toHaveLength(2);
      expect(p.folded).toBe(false);
    });
    expect(game.pot).toBe(15);
    expect(game.players.some((p) => p.chips === 995)).toBe(true);
    expect(game.players.some((p) => p.chips === 990)).toBe(true);
  });

  it('dealGame starts in preflop phase', () => {
    const game = dealGame(2);
    expect(game.phase).toBe(PHASES.PREFLOP);
  });

  it('dealGame with tutorial true returns tutorial: true', () => {
    const game = dealGame(10, 1, undefined, null, null, true);
    expect(game.tutorial).toBe(true);
  });

  it('tutorial games 1–3: bot never folds', () => {
    const state = {
      players: [
        { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500, folded: false },
        { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 500, folded: false },
      ],
      communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
      roundBets: [0, 0],
      currentBet: 10,
      gameNumber: 1,
      tutorial: true,
      phase: 'preflop',
      botStyles: { 0: 'defensive' },
    };
    for (let i = 0; i < 20; i++) {
      const result = botAction(state, 0);
      expect(result.action).not.toBe('fold');
    }
  });

  it('bot with best 5-card mass >= 200 never folds when facing a bet', () => {
    const state = {
      players: [
        { holeCards: [{ mass: 100 }, { mass: 90 }], chips: 500, folded: false },
        { holeCards: [{ mass: 1 }, { mass: 2 }], chips: 500, folded: false },
      ],
      communityCards: [{ mass: 80 }, { mass: 70 }, { mass: 60 }],
      roundBets: [0, 0],
      currentBet: 50,
      pot: 100,
      gameNumber: 4,
      phase: 'flop',
      botStyles: { 0: 'defensive' },
    };
    for (let i = 0; i < 15; i++) {
      const result = botAction(state, 0);
      expect(result.action).not.toBe('fold');
    }
  });

  it('dealFlop adds 3 community cards', () => {
    const game = dealGame(2);
    const afterFlop = dealFlop(game);
    expect(afterFlop.communityCards).toHaveLength(3);
    expect(afterFlop.phase).toBe(PHASES.FLOP);
  });

  it('dealTurn adds 1 card', () => {
    const game = dealGame(2);
    const afterFlop = dealFlop(game);
    const afterTurn = dealTurn(afterFlop);
    expect(afterTurn.communityCards).toHaveLength(4);
    expect(afterTurn.phase).toBe(PHASES.TURN);
  });

  it('dealRiver adds 1 card', () => {
    const game = dealGame(2);
    let state = dealFlop(game);
    state = dealTurn(state);
    state = dealRiver(state);
    expect(state.communityCards).toHaveLength(5);
    expect(state.phase).toBe(PHASES.RIVER);
  });

  it('dealGame game 4 starts with 1000 chips (minus blinds)', () => {
    const game = dealGame(2, 4);
    expect(STARTING_CHIPS).toBe(1000);
    expect(game.players.some((p) => p.chips === 995)).toBe(true);
    expect(game.players.some((p) => p.chips === 990)).toBe(true);
    expect(game.totalBetThisHand).toContain(5);
    expect(game.totalBetThisHand).toContain(10);
    expect(game.pots.length).toBeGreaterThan(0);
  });

  describe('Hold’em structure', () => {
    it('buildSidePots splits main and side pot for uneven all-ins', () => {
      const pots = buildSidePots([100, 300, 300], [false, false, false]);
      expect(pots).toHaveLength(2);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligible).toEqual([0, 1, 2]);
      expect(pots[1].amount).toBe(400);
      expect(pots[1].eligible).toEqual([1, 2]);
    });

    it('min raise uses previous raise increment', () => {
      let s = dealGame(2, 4);
      while (s.phase === PHASES.PREFLOP) {
        const idx = s.currentPlayerIndex;
        const toCall = s.currentBet - (s.roundBets[idx] || 0);
        s = playerAction(s, idx, toCall > 0 ? 'call' : 'check');
        if (isBettingRoundComplete(s)) s = advanceBettingRound(s, s.gameNumber);
      }
      expect(s.phase).toBe(PHASES.FLOP);
      const first = s.currentPlayerIndex;
      s = playerAction(s, first, 'bet', getMinOpenBet());
      expect(s.currentBet).toBe(BB);
      expect(s.lastRaiseSize).toBe(BB);
      const raiser = s.currentPlayerIndex;
      s = playerAction(s, raiser, 'raise', 30);
      expect(s.currentBet).toBe(30);
      expect(s.lastRaiseSize).toBe(20);
      const caller = s.currentPlayerIndex;
      const rejected = playerAction(s, caller, 'raise', 40);
      expect(rejected.currentBet).toBe(30);
      s = playerAction(s, caller, 'raise', 50);
      expect(s.currentBet).toBe(50);
    });

    it('heads-up: button is small blind and acts first preflop', () => {
      const s = dealGame(2, 4);
      const sb = s.dealerIndex;
      const bb = (s.dealerIndex + 1) % 2;
      expect(s.players[sb].chips).toBe(STARTING_CHIPS - 5);
      expect(s.players[bb].chips).toBe(STARTING_CHIPS - 10);
      expect(s.currentPlayerIndex).toBe(sb);
    });

    it('burns one card before flop', () => {
      const g = dealGame(2, 4);
      const flop = dealFlop(g);
      expect(flop.communityCards).toHaveLength(3);
      expect(flop.deckIndex).toBe(g.deckIndex + 4);
    });

    it('awards side pots at showdown — deep stack wins side pot only they contested', () => {
      const state = {
        players: [
          { holeCards: [{ mass: 1 }, { mass: 2 }], chips: 0, folded: false },
          { holeCards: [{ mass: 200 }, { mass: 90 }], chips: 200, folded: false },
          { holeCards: [{ mass: 50 }, { mass: 40 }], chips: 200, folded: false },
        ],
        communityCards: [{ mass: 10 }, { mass: 20 }, { mass: 30 }, { mass: 40 }, { mass: 50 }],
        pot: 700,
        totalBetThisHand: [100, 300, 300],
        phase: PHASES.RIVER,
        bettingRound: PHASES.RIVER,
        roundBets: [0, 0, 0],
        currentBet: 0,
        lastRaiseSize: BB,
        hasActedThisRound: [false, false, false],
        dealerIndex: 0,
        gameNumber: 4,
      };
      const next = advanceBettingRound(state, 4);
      expect(next.phase).toBe(PHASES.SHOWDOWN);
      expect(next.players[1].chips).toBe(900);
      expect(next.players[0].chips).toBe(0);
      expect(next.players[2].chips).toBe(200);
    });
  });

  describe('betting round completion', () => {
    it('gives BB option to act when everyone calls to the big blind preflop', () => {
      let s = dealGame(3, 4);
      const bbIndex = (s.dealerIndex + 2) % 3;
      // Dealer and SB call; round should not end before BB acts.
      s = playerAction(s, s.currentPlayerIndex, 'call');
      expect(isBettingRoundComplete(s)).toBe(false);
      s = playerAction(s, s.currentPlayerIndex, 'call');
      expect(isBettingRoundComplete(s)).toBe(false);
      expect(s.currentPlayerIndex).toBe(bbIndex);
      expect(s.phase).toBe(PHASES.PREFLOP);
      s = playerAction(s, bbIndex, 'check');
      expect(isBettingRoundComplete(s)).toBe(true);
      s = advanceBettingRound(s, s.gameNumber);
      expect(s.phase).toBe(PHASES.FLOP);
    });

    it('ends postflop street when everyone checks around', () => {
      let s = dealGame(2, 4);
      // Preflop: both call/check to flop
      while (s.phase === PHASES.PREFLOP) {
        const idx = s.currentPlayerIndex;
        const toCall = s.currentBet - (s.roundBets[idx] || 0);
        s = playerAction(s, idx, toCall > 0 ? 'call' : 'check');
        if (isBettingRoundComplete(s)) s = advanceBettingRound(s, s.gameNumber);
      }
      expect(s.phase).toBe(PHASES.FLOP);
      const first = s.currentPlayerIndex;
      s = playerAction(s, first, 'check');
      expect(isBettingRoundComplete(s)).toBe(false);
      s = playerAction(s, s.currentPlayerIndex, 'check');
      expect(isBettingRoundComplete(s)).toBe(true);
    });
  });

  describe('getBestHandWeight', () => {
    it('returns 0 for no cards', () => {
      expect(getBestHandWeight([], [])).toBe(0);
      expect(getBestHandWeight(null, null)).toBe(0);
    });

    it('sums hole cards only when no community cards', () => {
      const holeCards = [{ mass: 12 }, { mass: 16 }];
      expect(getBestHandWeight(holeCards, [])).toBe(28);
    });

    it('sums all 5 when 2 hole + 3 community', () => {
      const holeCards = [{ mass: 12 }, { mass: 16 }];
      const community = [{ mass: 1 }, { mass: 4 }, { mass: 6 }];
      expect(getBestHandWeight(holeCards, community)).toBe(39);
    });

    it('picks best 5 from 7 cards by total mass', () => {
      const holeCards = [{ mass: 100 }, { mass: 90 }]; // 190
      const community = [{ mass: 80 }, { mass: 70 }, { mass: 60 }, { mass: 50 }, { mass: 10 }];
      // Best 5: 100+90+80+70+60 = 400 (drop 50 and 10)
      expect(getBestHandWeight(holeCards, community)).toBe(400);
    });
  });

  describe('getBestHand', () => {
    it('returns cards and weight for best 5-card hand', () => {
      const holeCards = [{ symbol: 'C', mass: 12 }, { symbol: 'S', mass: 16 }];
      const community = [{ symbol: 'H', mass: 1 }];
      const result = getBestHand(holeCards, community);
      expect(result.weight).toBe(29);
      expect(result.cards).toHaveLength(3);
      expect(result.cards.map((c) => c.symbol)).toContain('C');
    });
  });

  describe('intro games 1–3', () => {
    it('game 1: one player gets NaCl (hole cards) and wins', () => {
      const g = dealGame(2, 1, 0);
      const symbols = g.players[0].holeCards.map((c) => c.symbol);
      expect(symbols).toContain('Na');
      expect(symbols).toContain('Cl');
    });
    it('game 2: one player gets H₂O (hole cards) and wins', () => {
      const g = dealGame(2, 2, 0);
      const symbols = g.players[0].holeCards.map((c) => c.symbol);
      expect(symbols).toContain('H');
      expect(symbols).toContain('O');
    });
    it('game 3: one player gets CHONP (hole C,H + flop O,N,P)', () => {
      const g = dealGame(2, 3, 1);
      const afterFlop = dealFlop(g);
      const p1Cards = [...afterFlop.players[1].holeCards, ...afterFlop.communityCards];
      const symbols = p1Cards.map((c) => c.symbol);
      expect(symbols).toContain('C');
      expect(symbols).toContain('H');
      expect(symbols).toContain('O');
      expect(symbols).toContain('N');
      expect(symbols).toContain('P');
    });
    it('game 4+ uses normal shuffle', () => {
      const g = dealGame(2, 4);
      expect(g.deck).toHaveLength(118);
    });
  });

  describe('getWinner', () => {
    it('game 1: player with NaCl wins', () => {
      const g = dealGame(2, 1, 0);
      const toRiver = dealRiver(dealTurn(dealFlop(g)));
      const { winnerIndex, reason } = getWinner(toRiver, 1);
      expect(winnerIndex).toBe(0);
      expect(reason).toBe('nacl');
    });
    it('game 2: player with H₂O wins', () => {
      const g = dealGame(2, 2, 1);
      const toRiver = dealRiver(dealTurn(dealFlop(g)));
      const { winnerIndex, reason } = getWinner(toRiver, 2);
      expect(winnerIndex).toBe(1);
      expect(reason).toBe('h2o');
    });
    it('game 3: player with CHONP wins', () => {
      const g = dealGame(2, 3, 1);
      const toRiver = dealRiver(dealTurn(dealFlop(g)));
      const { winnerIndex, reason } = getWinner(toRiver, 3);
      expect(winnerIndex).toBe(1);
      expect(reason).toBe('chonp');
    });
    it('game 4+: highest best-hand mass wins', () => {
      const g = dealGame(2, 4);
      const state = { ...g, communityCards: [{ mass: 10 }, { mass: 20 }, { mass: 30 }, { mass: 40 }, { mass: 50 }], phase: PHASES.RIVER };
      state.players[0].holeCards = [{ mass: 100 }, { mass: 90 }];
      state.players[1].holeCards = [{ mass: 1 }, { mass: 2 }];
      const { winnerIndex, reason } = getWinner(state, 4);
      expect(winnerIndex).toBe(0);
      expect(reason).toBe('mass');
    });
    it('when everyone folds, winnerIndex and winnerReason are set (so UI shows Winner)', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500, folded: true },
          { holeCards: [{ symbol: 'H' }, { symbol: 'O' }], chips: 500, folded: false },
        ],
        communityCards: [{ symbol: 'V' }, { symbol: 'Cr' }, { symbol: 'Mn' }],
        pot: 100,
        totalBetThisHand: [50, 50],
        phase: PHASES.FLOP,
        bettingRound: PHASES.FLOP,
        roundBets: [0, 0],
        currentBet: 0,
        lastRaiseSize: BB,
        hasActedThisRound: [false, false],
        dealerIndex: 0,
        gameNumber: 4,
      };
      const next = advanceBettingRound(state, 4);
      expect(next.winnerIndex).toBe(1);
      expect(next.winnerReason).toBe('h2o');
      expect(next.phase).toBe('showdown');
      expect(next.players[1].chips).toBe(600);
    });
    it('splits pot when two players tie on best mass (winnerIndices, each gets half)', () => {
      const state = {
        players: [
          { holeCards: [{ mass: 100 }, { mass: 90 }], chips: 500, folded: false },
          { holeCards: [{ mass: 100 }, { mass: 90 }], chips: 500, folded: false },
        ],
        communityCards: [{ mass: 10 }, { mass: 20 }, { mass: 30 }, { mass: 40 }, { mass: 50 }],
        pot: 100,
        totalBetThisHand: [50, 50],
        phase: PHASES.RIVER,
        bettingRound: PHASES.RIVER,
        roundBets: [0, 0],
        currentBet: 0,
        lastRaiseSize: BB,
        hasActedThisRound: [false, false],
        dealerIndex: 0,
        gameNumber: 4,
      };
      const next = advanceBettingRound(state, 4);
      expect(next.phase).toBe('showdown');
      expect(next.winnerIndices).toEqual([0, 1]);
      expect(next.winnerIndex).toBe(0);
      expect(next.winnerReason).toBe('mass');
      expect(next.players[0].chips).toBe(550);
      expect(next.players[1].chips).toBe(550);
      expect(next.pot).toBe(0);
    });

    it('advanceIfCurrentPlayerInvalid advances when current player is all-in (chips 0, cannot act)', () => {
      const state = {
        players: [
          { holeCards: [], chips: 0, folded: false },
          { holeCards: [], chips: 500, folded: false },
          { holeCards: [], chips: 500, folded: false },
        ],
        communityCards: [],
        pot: 100,
        totalBetThisHand: [50, 25, 25],
        currentBet: 10,
        roundBets: [10, 0, 0],
        currentPlayerIndex: 0,
        phase: PHASES.FLOP,
        bettingRound: PHASES.FLOP,
        lastRaiseSize: BB,
        hasActedThisRound: [false, false, false],
        dealerIndex: 0,
        gameNumber: 4,
      };
      const next = advanceIfCurrentPlayerInvalid(state, 4);
      expect(next).not.toBeNull();
      expect(next.currentPlayerIndex).toBe(1);
      expect(next.lastAction).toEqual({ playerIndex: 0, action: 'all-in' });
    });

    it('advanceIfCurrentPlayerInvalid advances when current player is folded (prevents stuck Bot thinking)', () => {
      const state = {
        players: [
          { holeCards: [], chips: 1000, folded: false },
          { holeCards: [], chips: 1000, folded: true },
          { holeCards: [], chips: 1000, folded: false },
        ],
        communityCards: [],
        pot: 0,
        totalBetThisHand: [0, 0, 0],
        currentBet: 10,
        roundBets: [0, 0, 0],
        currentPlayerIndex: 1,
        phase: PHASES.PREFLOP,
        bettingRound: PHASES.PREFLOP,
        lastRaiseSize: BB,
        hasActedThisRound: [false, false, false],
        dealerIndex: 0,
        gameNumber: 4,
      };
      const next = advanceIfCurrentPlayerInvalid(state, 4);
      expect(next).not.toBeNull();
      expect(next.currentPlayerIndex).toBe(2);
    });

    it('hand order: CHONP beats H₂O beats NaCl beats CO₂ beats mass (any game)', () => {
      const base = { communityCards: [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }, { mass: 1 }, { mass: 2 }], phase: PHASES.RIVER };
      const withNaCl = { ...base, players: [
        { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], folded: false },
        { holeCards: [{ symbol: 'C' }, { symbol: 'H' }], folded: false },
      ] };
      const { winnerIndex: w1, reason: r1 } = getWinner(withNaCl, 4);
      expect(w1).toBe(1);
      expect(r1).toBe('chonp');

      const withH2O = { ...base, players: [
        { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], folded: false },
        { holeCards: [{ symbol: 'H' }, { symbol: 'O' }], folded: false },
      ] };
      const { winnerIndex: w2, reason: r2 } = getWinner(withH2O, 4);
      expect(w2).toBe(1);
      expect(r2).toBe('h2o');

      const withMass = { ...base, players: [
        { holeCards: [{ mass: 100 }, { mass: 90 }], folded: false },
        { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], folded: false },
      ] };
      const { winnerIndex: w3, reason: r3 } = getWinner(withMass, 4);
      expect(w3).toBe(1);
      expect(r3).toBe('nacl');

      const withCo2 = { ...base, players: [
        { holeCards: [{ mass: 100 }, { mass: 90 }], folded: false },
        { holeCards: [{ symbol: 'C' }, { symbol: 'O' }], folded: false },
      ] };
      const { winnerIndex: wCo2, reason: rCo2 } = getWinner(withCo2, 4);
      expect(wCo2).toBe(1);
      expect(rCo2).toBe('co2');

      const co2VsNacl = { ...base, players: [
        { holeCards: [{ symbol: 'C' }, { symbol: 'O' }], folded: false },
        { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], folded: false },
      ] };
      const { winnerIndex: wCo2Na, reason: rCo2Na } = getWinner(co2VsNacl, 4);
      expect(wCo2Na).toBe(1);
      expect(rCo2Na).toBe('nacl');

      const massVsMass = { ...base, players: [
        { holeCards: [{ mass: 100 }, { mass: 90 }], folded: false },
        { holeCards: [{ mass: 1 }, { mass: 2 }], folded: false },
      ] };
      const { winnerIndex: w4, winnerIndices: wi4, reason: r4 } = getWinner(massVsMass, 4);
      expect(w4).toBe(0);
      expect(wi4).toEqual([0]);
      expect(r4).toBe('mass');
    });
    it('returns winnerIndices with multiple players when same best mass (split pot)', () => {
      const base = { communityCards: [{ mass: 10 }, { mass: 20 }, { mass: 30 }, { mass: 40 }, { mass: 50 }], phase: PHASES.RIVER };
      // Same best 5-card mass: 100+90+50+40+30 = 310 vs 100+90+50+40+30 = 310
      const tied = { ...base, players: [
        { holeCards: [{ mass: 100 }, { mass: 90 }], folded: false },
        { holeCards: [{ mass: 100 }, { mass: 90 }], folded: false },
      ] };
      const { winnerIndex, winnerIndices, reason } = getWinner(tied, 4);
      expect(reason).toBe('mass');
      expect(winnerIndices).toHaveLength(2);
      expect(winnerIndices).toContain(0);
      expect(winnerIndices).toContain(1);
      expect(winnerIndex).toBe(winnerIndices[0]);
    });
  });

  describe('getMoleculeCombo', () => {
    it('returns h2o when 1+ H and 1+ O', () => {
      const hole = [{ symbol: 'H' }];
      const community = [{ symbol: 'O' }];
      expect(getMoleculeCombo(hole, community)).toBe('h2o');
    });
    it('returns nacl when Na and Cl present', () => {
      const hole = [{ symbol: 'Na' }];
      const community = [{ symbol: 'Cl' }];
      expect(getMoleculeCombo(hole, community)).toBe('nacl');
    });
    it('returns chonp when C, H, O, N, P all present', () => {
      const hole = [{ symbol: 'C' }, { symbol: 'H' }];
      const community = [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }];
      expect(getMoleculeCombo(hole, community)).toBe('chonp');
    });
    it('returns co2 when C and O present without H', () => {
      const hole = [{ symbol: 'C' }];
      const community = [{ symbol: 'O' }];
      expect(getMoleculeCombo(hole, community)).toBe('co2');
    });
    it('returns null when no combo', () => {
      expect(getMoleculeCombo([{ symbol: 'Fe' }], [])).toBe(null);
    });
  });

  describe('botAction with winning molecule (games 1–3)', () => {
    it('game 1: bot with NaCl raises max (all-in) when facing a bet', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 500 },
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500 },
        ],
        communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
        roundBets: [0, 0],
        currentBet: 10,
        gameNumber: 1,
        botStyles: { 0: 'defensive' },
      };
      const result = botAction(state, 0);
      expect(result.action).toBe('raise');
      expect(result.amount).toBe(500);
    });

    it('game 1: bot with NaCl bets all-in when no bet to call', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 500 },
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500 },
        ],
        communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
        roundBets: [0, 0],
        currentBet: 0,
        gameNumber: 1,
        botStyles: { 0: 'defensive' },
      };
      const result = botAction(state, 0);
      expect(result.action).toBe('bet');
      expect(result.amount).toBe(500);
    });

    it('game 2: bot with H₂O raises max', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 300 },
          { holeCards: [{ symbol: 'H' }, { symbol: 'O' }], chips: 300 },
        ],
        communityCards: [{ symbol: 'A' }, { symbol: 'B' }, { symbol: 'C' }],
        roundBets: [0, 0],
        currentBet: 10,
        gameNumber: 2,
        botStyles: { 1: 'random' },
      };
      const result = botAction(state, 1);
      expect(result.action).toBe('raise');
      expect(result.amount).toBe(300);
    });

    it('game 3: bot with CHONP raises max', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 200 },
          { holeCards: [{ symbol: 'C' }, { symbol: 'H' }], chips: 200 },
        ],
        communityCards: [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }],
        roundBets: [0, 0],
        currentBet: 10,
        gameNumber: 3,
        botStyles: { 1: 'aggressive' },
      };
      const result = botAction(state, 1);
      expect(result.action).toBe('raise');
      expect(result.amount).toBe(200);
    });

    it('bot without winning molecule uses normal style', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500 },
          { holeCards: [{ symbol: 'Na' }, { symbol: 'Cl' }], chips: 500 },
        ],
        communityCards: [{ symbol: 'X' }, { symbol: 'Y' }, { symbol: 'Z' }],
        roundBets: [0, 0],
        currentBet: 10,
        gameNumber: 1,
        botStyles: { 0: 'defensive' },
      };
      const result = botAction(state, 0);
      expect(['fold', 'call', 'raise']).toContain(result.action);
      if (result.action === 'raise') expect(result.amount).toBeLessThanOrEqual(500);
    });

    it('game 3 preflop: bot with C and H in hole never folds', () => {
      const state = {
        players: [
          { holeCards: [{ symbol: 'Fe' }, { symbol: 'Cu' }], chips: 500 },
          { holeCards: [{ symbol: 'C' }, { symbol: 'H' }], chips: 500 },
        ],
        communityCards: [],
        roundBets: [0, 0],
        currentBet: 10,
        gameNumber: 3,
        phase: 'preflop',
        botStyles: { 1: 'defensive' },
      };
      for (let i = 0; i < 30; i++) {
        const result = botAction(state, 1);
        expect(result.action).not.toBe('fold');
        expect(['call', 'raise', 'check']).toContain(result.action);
      }
    });
  });

  describe('autoAdvanceIdlePlayers', () => {
    it('heads-up both all-in on flop runs through turn and river to showdown', () => {
      let s = dealGame(2, 4);
      s = dealFlop(s);
      s = {
        ...s,
        players: s.players.map((p) => ({ ...p, chips: 0 })),
        roundBets: [0, 0],
        currentBet: 0,
        hasActedThisRound: [false, false],
        bettingRound: PHASES.FLOP,
        currentPlayerIndex: 0,
      };
      const advanced = autoAdvanceIdlePlayers(s, 4);
      expect(advanced.phase).toBe(PHASES.SHOWDOWN);
      expect(advanced.communityCards).toHaveLength(5);
      expect(advanced.winnerIndex).toBeGreaterThanOrEqual(0);
    });

    it('heads-up both all-in after last call on preflop reaches showdown', () => {
      let s = dealGame(2, 4);
      while (s.phase === PHASES.PREFLOP) {
        const idx = s.currentPlayerIndex;
        const toCall = s.currentBet - (s.roundBets[idx] || 0);
        const allInTotal = (s.roundBets[idx] || 0) + s.players[idx].chips;
        s = playerAction(s, idx, toCall > 0 ? 'raise' : 'bet', allInTotal);
        if (isBettingRoundComplete(s)) s = advanceBettingRound(s, s.gameNumber);
      }
      expect(s.phase).toBe(PHASES.FLOP);
      expect(s.players.every((p) => p.chips === 0)).toBe(true);
      const advanced = autoAdvanceIdlePlayers(s, s.gameNumber);
      expect(advanced.phase).toBe(PHASES.SHOWDOWN);
      expect(advanced.communityCards).toHaveLength(5);
    });
  });

  describe('runOutBoardWhenLocked', () => {
    it('isRunOutLocked when one active player has chips and the other is all-in', () => {
      const s = {
        players: [
          { folded: false, chips: 1980 },
          { folded: false, chips: 0 },
        ],
        communityCards: [],
        phase: PHASES.FLOP,
      };
      expect(isRunOutLocked(s)).toBe(true);
    });

    it('heads-up one all-in: check on flop runs out turn and river to showdown', () => {
      let s = dealGame(2, 4);
      s = dealFlop(s);
      s = {
        ...s,
        players: [
          { ...s.players[0], chips: 1980 },
          { ...s.players[1], chips: 0 },
        ],
        roundBets: [0, 0],
        currentBet: 0,
        hasActedThisRound: [false, false],
        bettingRound: PHASES.FLOP,
        currentPlayerIndex: 0,
      };
      s = playerAction(s, 0, 'check');
      expect(isRunOutLocked(s)).toBe(true);
      expect(isBettingRoundComplete(s)).toBe(true);
      const runOut = runOutBoardWhenLocked(s, 4);
      expect(runOut.phase).toBe(PHASES.SHOWDOWN);
      expect(runOut.communityCards).toHaveLength(5);
    });
  });

  describe('isGameOver', () => {
    it('is false during a hand when a player is all-in with 0 chips', () => {
      const s = {
        gameNumber: 4,
        phase: PHASES.FLOP,
        players: [{ chips: 1980, folded: false }, { chips: 0, folded: false }],
      };
      expect(isGameOver(s)).toBe(false);
    });

    it('is true at showdown when any player has 0 chips (game 4+)', () => {
      const s = {
        gameNumber: 4,
        phase: PHASES.SHOWDOWN,
        players: [{ chips: 2000, folded: false }, { chips: 0, folded: false }],
      };
      expect(isGameOver(s)).toBe(true);
      expect(getSessionWinnerIndex(s)).toBe(0);
    });

    it('is false at showdown when everyone still has chips', () => {
      const s = {
        gameNumber: 4,
        phase: PHASES.SHOWDOWN,
        players: [{ chips: 1200, folded: false }, { chips: 800, folded: false }],
      };
      expect(isGameOver(s)).toBe(false);
    });

    it('is false in tutorial games even if a player has 0 chips', () => {
      const s = {
        gameNumber: 3,
        phase: PHASES.SHOWDOWN,
        players: [{ chips: 0, folded: false }, { chips: 1000, folded: false }],
      };
      expect(isGameOver(s)).toBe(false);
    });
  });
});
