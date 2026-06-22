import { hasVerifiedIdentity, isGuest, isSubscriber, SUBSCRIBER_GOAL } from '../auth/authHelpers.js';
import { validateDisplayName } from '../scoreboard/scoreboard.js';

const PROVIDER_LABELS = {
  'google.com': 'Google',
  password: 'Email',
  'emailLink': 'Email link',
  anonymous: 'Guest',
};

export function authProviderLabel(providerId) {
  return PROVIDER_LABELS[providerId] ?? providerId;
}

export function formatProfileProviders(providers) {
  if (!providers?.length) return '—';
  return providers
    .filter((id) => id !== 'anonymous')
    .map(authProviderLabel)
    .filter(Boolean)
    .join(', ') || 'Guest';
}

export function profileStatusLabel(user, profile) {
  if (!user) return 'Signed out';
  if (isGuest(user)) return 'Guest';
  if (isSubscriber(profile)) return 'Verified subscriber';
  if (hasVerifiedIdentity(user)) return 'Verified — finishing setup…';
  return 'Email verification pending';
}

export function canEditProfile(user, profile) {
  return !!user && !isGuest(user);
}

export function profileCoinSummary(profile) {
  return profile?.coinBalance ?? 0;
}

export function profileSubscriberSummary(profile, subscriberGoal = SUBSCRIBER_GOAL) {
  if (!profile?.isSubscriber) return null;
  return {
    subscriberNumber: profile.subscriberNumber ?? null,
    coinBalance: profile.coinBalance ?? 0,
    subscriberGoal,
  };
}

export function timestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value.seconds != null) return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function formatProfileDate(value) {
  const ms = timestampToMs(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export { validateDisplayName };
