/** Verified identity = Google sign-in OR email/password with emailVerified. */
export function hasVerifiedIdentity(user) {
  if (!user || user.isAnonymous) return false;
  const providers = user.providerData?.map((p) => p.providerId) ?? [];
  if (providers.includes('google.com')) return true;
  if (user.email && user.emailVerified) return true;
  return false;
}

/** Anonymous or signed-out player. */
export function isGuest(user) {
  return !user || user.isAnonymous;
}

/** Full subscriber from stored profile. */
export function isSubscriber(profile) {
  return profile?.isSubscriber === true;
}

/** Google OR verified email — required to become a subscriber. */
export function qualifiesAsSubscriber(user) {
  return hasVerifiedIdentity(user);
}

export function authProvidersFromUser(user) {
  if (!user) return [];
  const fromProviders = user.providerData?.map((p) => p.providerId).filter(Boolean) ?? [];
  if (user.isAnonymous && !fromProviders.includes('anonymous')) {
    return ['anonymous', ...fromProviders];
  }
  return fromProviders.length ? fromProviders : (user.isAnonymous ? ['anonymous'] : []);
}

export function subscriberProgressStep(user, profile) {
  if (isSubscriber(profile)) return 'complete';
  if (!user || user.isAnonymous) return 'identity';
  if (!hasVerifiedIdentity(user)) return 'email-verify';
  return 'complete';
}

export const SUBSCRIBER_GOAL = 10000;
