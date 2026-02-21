import { describe, it, expect } from 'vitest';
import {
  dealGame,
  dealFlop,
  dealTurn,
  dealRiver,
  getBestHandWeight,
  getBestHand,
  getMoleculeCombo,
  PHASES,
  createSession,
  dealHand,
  dealFlopSession,
  dealTurnSession,
  dealRiverSession,
  endHand,
  getHandRank,
  HAND_TIERS,
  TOTAL_ATOMCOINS,
  PER_PLAYER_ATOMCOINS,
  NUM_TABLE_PLAYERS,
} from './gameLogic.js';

describe('gameLogic', () => {
  describe('session (10 players, atomcoins)', () => {
    it('createSession creates 10 players with 1000 atomcoins each', () => {
      const s = createSession('guest-1', 'game-1');
      expect(s.players).toHaveLength(NUM_TABLE_PLAYERS);
      s.players.forEach((p, i) => {
        expect(p.chips).toBe(PER_PLAYER_ATOMCOINS);
        expect(p.isBot).toBe(i !== 0);
        expect(p.eliminated).toBe(false);
      });
      expect(s.guestName).toBe('guest-1');
      expect(s.gameName).toBe('game-1');
      expect(s.currentHand).toBe(null);
    });

    it('dealHand deals 2 cards each and takes ante', () => {
      const s = createSession('g', 'gm');
      const after = dealHand(s);
      expect(after.currentHand).toBeTruthy();
      expect(after.currentHand.phase).toBe(PHASES.PREFLOP);
      expect(after.currentHand.communityCards).toHaveLength(0);
      const active = after.players.filter((p) => !p.eliminated && p.holeCards.length === 2);
      expect(active.length).toBe(10);
      active.forEach((p) => {
        expect(p.holeCards).toHaveLength(2);
        expect(p.chips).toBe(1000 - 50);
      });
      expect(after.currentHand.pot).toBe(50 * 10);
    });

    it('dealFlopSession adds 3 community cards', () => {
      const s = createSession('g', 'gm');
      const withHand = dealHand(s);
      const after = dealFlopSession(withHand);
      expect(after.currentHand.communityCards).toHaveLength(3);
      expect(after.currentHand.phase).toBe(PHASES.FLOP);
    });

    it('endHand assigns pot to winner and can set gameOver when someone has 10000', () => {
      const s = createSession('g', 'gm');
      let state = dealHand(s);
      state = dealFlopSession(state);
      state = dealTurnSession(state);
      state = dealRiverSession(state);
      const { session: after, gameOver, winner, winAmount } = endHand(state);
      expect(after.currentHand.phase).toBe(PHASES.SHOWDOWN);
      expect(winAmount).toBe(500);
      const winners = after.players.filter((p) => p.chips > 1000);
      expect(winners.length).toBeGreaterThanOrEqual(1);
      expect(gameOver).toBe(false);
      expect(winner).toBeTruthy();
    });
  });

  it('dealGame creates 2 players with 2 hole cards each', () => {
    const game = dealGame(2);
    expect(game.players).toHaveLength(2);
    game.players.forEach((p) => {
      expect(p.holeCards).toHaveLength(2);
      expect(p.chips).toBe(1000);
      expect(p.folded).toBe(false);
    });
  });

  it('dealGame starts in preflop phase', () => {
    const game = dealGame(2);
    expect(game.phase).toBe(PHASES.PREFLOP);
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
    it('game 1 has H and O (player 0 hole + flop)', () => {
      const g = dealGame(2, 1);
      const afterFlop = dealFlop(g);
      const p0Cards = [...afterFlop.players[0].holeCards, ...afterFlop.communityCards];
      const symbols = p0Cards.map((c) => c.symbol);
      expect(symbols).toContain('H');
      expect(symbols).toContain('O');
    });
    it('game 2 has Na and Cl for NaCl (player 0 hole + flop)', () => {
      const g = dealGame(2, 2);
      const afterFlop = dealFlop(g);
      const p0Cards = [...afterFlop.players[0].holeCards, ...afterFlop.communityCards];
      const symbols = p0Cards.map((c) => c.symbol);
      expect(symbols).toContain('Na');
      expect(symbols).toContain('Cl');
    });
    it('game 3 has C,H,O,N,P for CHONP (player 1 + flop)', () => {
      const g = dealGame(2, 3);
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

  describe('getHandRank and win order', () => {
    it('CHONP has highest tier', () => {
      const hole = [{ symbol: 'C' }, { symbol: 'H' }];
      const community = [{ symbol: 'O' }, { symbol: 'N' }, { symbol: 'P' }];
      const r = getHandRank(hole, community);
      expect(r.tier).toBe(HAND_TIERS.CHONP);
      expect(r.combo).toBe('chonp');
    });
    it('H2O has tier above NaCl and weight', () => {
      const h2o = getHandRank([{ symbol: 'H' }], [{ symbol: 'O' }]);
      const nacl = getHandRank([{ symbol: 'Na' }], [{ symbol: 'Cl' }]);
      const weight = getHandRank([{ symbol: 'Fe', mass: 56 }], [{ symbol: 'Au', mass: 197 }]);
      expect(h2o.tier).toBe(HAND_TIERS.H2O);
      expect(nacl.tier).toBe(HAND_TIERS.NACL);
      expect(weight.tier).toBe(HAND_TIERS.WEIGHT);
      expect(h2o.tier > nacl.tier).toBe(true);
      expect(nacl.tier > weight.tier).toBe(true);
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
    it('returns null when no combo', () => {
      expect(getMoleculeCombo([{ symbol: 'Fe' }], [])).toBe(null);
    });
  });
});
