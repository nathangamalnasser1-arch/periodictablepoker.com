import { describe, it, expect } from 'vitest';
import { slug, expired, clean, hasOpenSlot, formatFirebaseError } from './core.js';

describe('multiplayer core helpers', () => {
  describe('slug', () => {
    it('lowercases and hyphenates game names', () => {
      expect(slug('Test Room')).toBe('test-room');
    });

    it('strips non-alphanumeric characters', () => {
      expect(slug('Hello!!! World???')).toBe('hello-world');
    });

    it('returns game for empty input', () => {
      expect(slug('   ')).toBe('game');
    });
  });

  describe('expired', () => {
    it('returns false when createdAt is missing', () => {
      expect(expired(null)).toBe(false);
    });

    it('returns true when game is older than TTL', () => {
      const old = { seconds: Math.floor(Date.now() / 1000) - 31 * 60 };
      expect(expired(old)).toBe(true);
    });

    it('returns false for recent games', () => {
      const recent = { seconds: Math.floor(Date.now() / 1000) - 60 };
      expect(expired(recent)).toBe(false);
    });
  });

  describe('hasOpenSlot', () => {
    it('returns true when a slot is empty', () => {
      expect(hasOpenSlot({ playerIds: ['uid1', null, null] })).toBe(true);
    });

    it('returns false when all slots are filled', () => {
      expect(hasOpenSlot({ playerIds: ['a', 'b', 'c'] })).toBe(false);
    });
  });

  describe('clean', () => {
    it('removes undefined via JSON round-trip', () => {
      const input = { a: 1, b: undefined, nested: { c: 2 } };
      expect(clean(input)).toEqual({ a: 1, nested: { c: 2 } });
    });

    it('handles null', () => {
      expect(clean(null)).toBe(null);
    });
  });

  describe('formatFirebaseError', () => {
    it('explains when auth is not configured', () => {
      const msg = formatFirebaseError({ code: 'auth/configuration-not-found', message: 'Firebase: Error (auth/configuration-not-found).' });
      expect(msg).toMatch(/Get started/i);
      expect(msg).toMatch(/Anonymous/i);
    });

    it('explains when anonymous auth is disabled', () => {
      const msg = formatFirebaseError({ code: 'auth/operation-not-allowed', message: 'Firebase: Error (auth/operation-not-allowed).' });
      expect(msg).toMatch(/Anonymous/i);
      expect(msg).toMatch(/Firebase Console/i);
    });
  });
});
