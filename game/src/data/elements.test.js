import { describe, it, expect } from 'vitest';
import { ELEMENTS, createDeck, shuffle } from './elements.js';

describe('elements', () => {
  it('has 118 elements', () => {
    expect(ELEMENTS).toHaveLength(118);
  });

  it('each element has symbol, name, number', () => {
    ELEMENTS.forEach((el, i) => {
      expect(el).toHaveProperty('symbol');
      expect(el).toHaveProperty('name');
      expect(el).toHaveProperty('number');
      expect(el.number).toBe(i + 1);
    });
  });

  it('createDeck returns 118 cards with unique ids', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(118);
    const ids = deck.map((c) => c.id);
    expect(new Set(ids).size).toBe(118);
  });

  it('shuffle randomizes order', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(118);
    expect(shuffled.map((c) => c.id).sort()).toEqual(deck.map((c) => c.id).sort());
  });
});
