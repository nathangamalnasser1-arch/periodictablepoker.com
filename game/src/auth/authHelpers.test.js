import { describe, it, expect } from 'vitest';
import {
  hasVerifiedIdentity,
  isGuest,
  isSubscriber,
  qualifiesAsSubscriber,
  authProvidersFromUser,
  subscriberProgressStep,
  SUBSCRIBER_GOAL,
} from './authHelpers.js';

describe('authHelpers', () => {
  describe('hasVerifiedIdentity', () => {
    it('rejects anonymous users', () => {
      expect(hasVerifiedIdentity({ isAnonymous: true, providerData: [] })).toBe(false);
    });

    it('accepts Google sign-in', () => {
      expect(hasVerifiedIdentity({
        isAnonymous: false,
        providerData: [{ providerId: 'google.com' }],
      })).toBe(true);
    });

    it('accepts verified email', () => {
      expect(hasVerifiedIdentity({
        isAnonymous: false,
        email: 'a@b.com',
        emailVerified: true,
        providerData: [{ providerId: 'password' }],
      })).toBe(true);
    });

    it('rejects unverified email without Google', () => {
      expect(hasVerifiedIdentity({
        isAnonymous: false,
        email: 'a@b.com',
        emailVerified: false,
        providerData: [{ providerId: 'password' }],
      })).toBe(false);
    });
  });

  describe('isGuest', () => {
    it('treats null and anonymous as guest', () => {
      expect(isGuest(null)).toBe(true);
      expect(isGuest({ isAnonymous: true })).toBe(true);
    });

    it('non-anonymous is not guest', () => {
      expect(isGuest({ isAnonymous: false })).toBe(false);
    });
  });

  describe('isSubscriber', () => {
    it('requires profile flag', () => {
      expect(isSubscriber(null)).toBe(false);
      expect(isSubscriber({ isSubscriber: false })).toBe(false);
      expect(isSubscriber({ isSubscriber: true })).toBe(true);
    });
  });

  describe('qualifiesAsSubscriber', () => {
    const googleUser = { isAnonymous: false, providerData: [{ providerId: 'google.com' }] };

    it('needs verified identity only', () => {
      expect(qualifiesAsSubscriber(googleUser)).toBe(true);
      expect(qualifiesAsSubscriber({
        isAnonymous: false,
        email: 'a@b.com',
        emailVerified: true,
        providerData: [{ providerId: 'password' }],
      })).toBe(true);
      expect(qualifiesAsSubscriber({ isAnonymous: true })).toBe(false);
    });
  });

  describe('authProvidersFromUser', () => {
    it('includes anonymous for guest', () => {
      expect(authProvidersFromUser({ isAnonymous: true, providerData: [] })).toContain('anonymous');
    });
  });

  describe('subscriberProgressStep', () => {
    it('returns complete for subscriber profile', () => {
      expect(subscriberProgressStep({}, { isSubscriber: true })).toBe('complete');
    });

    it('returns identity for guest', () => {
      expect(subscriberProgressStep({ isAnonymous: true }, null)).toBe('identity');
    });
  });

  describe('SUBSCRIBER_GOAL', () => {
    it('is 10000', () => {
      expect(SUBSCRIBER_GOAL).toBe(10000);
    });
  });
});
