import { describe, it, expect } from 'vitest';
import {
  authProviderLabel,
  formatProfileProviders,
  profileStatusLabel,
  canEditProfile,
  profileCoinSummary,
  profileSubscriberSummary,
  formatProfileDate,
  validateDisplayName,
} from './profileDisplay.js';

describe('profileDisplay', () => {
  describe('authProviderLabel', () => {
    it('maps known providers', () => {
      expect(authProviderLabel('google.com')).toBe('Google');
      expect(authProviderLabel('password')).toBe('Email');
    });
  });

  describe('formatProfileProviders', () => {
    it('formats provider list', () => {
      expect(formatProfileProviders(['google.com'])).toBe('Google');
      expect(formatProfileProviders(['password'])).toBe('Email');
    });

    it('returns Guest for anonymous only', () => {
      expect(formatProfileProviders(['anonymous'])).toBe('Guest');
    });
  });

  describe('profileStatusLabel', () => {
    it('labels guest and subscriber states', () => {
      expect(profileStatusLabel(null, null)).toBe('Signed out');
      expect(profileStatusLabel({ isAnonymous: true }, null)).toBe('Guest');
      expect(profileStatusLabel(
        { isAnonymous: false, providerData: [{ providerId: 'google.com' }] },
        { isSubscriber: true },
      )).toBe('Verified subscriber');
    });
  });

  describe('canEditProfile', () => {
    it('allows edit for signed-in non-guest', () => {
      expect(canEditProfile({ isAnonymous: false }, {})).toBe(true);
      expect(canEditProfile({ isAnonymous: true }, {})).toBe(false);
    });
  });

  describe('profileCoinSummary', () => {
    it('returns balance or zero', () => {
      expect(profileCoinSummary({ coinBalance: 42 })).toBe(42);
      expect(profileCoinSummary(null)).toBe(0);
    });
  });

  describe('profileSubscriberSummary', () => {
    it('returns null for non-subscribers', () => {
      expect(profileSubscriberSummary({ isSubscriber: false })).toBeNull();
    });

    it('returns subscriber stats', () => {
      const summary = profileSubscriberSummary({ isSubscriber: true, subscriberNumber: 5, coinBalance: 10 });
      expect(summary.subscriberNumber).toBe(5);
      expect(summary.coinBalance).toBe(10);
    });
  });

  describe('formatProfileDate', () => {
    it('returns dash for missing date', () => {
      expect(formatProfileDate(null)).toBe('—');
    });
  });

  describe('validateDisplayName', () => {
    it('rejects empty names', () => {
      expect(validateDisplayName('').ok).toBe(false);
    });
  });
});
