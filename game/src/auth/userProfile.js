import {
  doc, getDoc, setDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import {
  authProvidersFromUser,
  hasVerifiedIdentity,
  qualifiesAsSubscriber,
  SUBSCRIBER_GOAL,
} from './authHelpers.js';

import { DEFAULT_STATS } from '../stats/stats.js';

export function defaultProfileFromUser(user) {
  return {
    displayName: user.displayName || user.email?.split('@')[0] || 'Player',
    email: user.email ?? null,
    authProviders: authProvidersFromUser(user),
    emailVerified: !!user.emailVerified,
    isSubscriber: false,
    subscriberNumber: null,
    coinBalance: 0,
    createdAt: serverTimestamp(),
    subscribedAt: null,
    ...DEFAULT_STATS,
  };
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

export async function upsertUserFromAuth(user) {
  if (!user?.uid) return null;
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  const base = existing.exists() ? existing.data() : defaultProfileFromUser(user);

  const providers = authProvidersFromUser(user);
  const patch = {
    displayName: user.displayName || base.displayName || 'Player',
    email: user.email ?? base.email ?? null,
    authProviders: providers,
    emailVerified: providers.includes('google.com') || !!user.emailVerified || !!base.emailVerified,
  };

  await setDoc(ref, patch, { merge: true });
  return getUserProfile(user.uid);
}

export async function fetchSubscriberCount() {
  const snap = await getDoc(doc(db, 'metrics', 'subscribers'));
  return Math.min(snap.data()?.count ?? 0, SUBSCRIBER_GOAL + 9999);
}

/** When Google or verified email is confirmed, mark subscriber and bump public counter once. */
export async function finalizeSubscriber(user, profile) {
  if (!user?.uid || !qualifiesAsSubscriber(user)) {
    return profile;
  }
  if (profile?.isSubscriber) return profile;

  const userRef = doc(db, 'users', user.uid);
  const metricsRef = doc(db, 'metrics', 'subscribers');

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const data = userSnap.data() ?? {};
    if (data.isSubscriber) return;

    const metricsSnap = await transaction.get(metricsRef);
    const nextCount = (metricsSnap.data()?.count ?? 0) + 1;

    transaction.set(userRef, {
      isSubscriber: true,
      subscriberNumber: nextCount,
      subscribedAt: serverTimestamp(),
      emailVerified: hasVerifiedIdentity(user),
    }, { merge: true });

    transaction.set(metricsRef, { count: nextCount }, { merge: true });
  });

  return getUserProfile(user.uid);
}

export async function updateUserDisplayName(uid, displayName) {
  if (!uid) throw new Error('Not signed in');
  const validated = validateDisplayNameForProfile(displayName);
  if (!validated.ok) throw new Error(validated.error);

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { displayName: validated.value }, { merge: true });

  const entryRef = doc(db, 'leaderboards', 'ptp-coins', 'entries', uid);
  const statsRef = doc(db, 'leaderboards', 'ptp-stats', 'entries', uid);
  await setDoc(userRef, { displayName: validated.value }, { merge: true });

  const entrySnap = await getDoc(entryRef);
  if (entrySnap.exists()) {
    await setDoc(entryRef, { displayName: validated.value }, { merge: true });
  }

  const statsSnap = await getDoc(statsRef);
  if (statsSnap.exists()) {
    await setDoc(statsRef, { displayName: validated.value }, { merge: true });
  }

  return getUserProfile(uid);
}

function validateDisplayNameForProfile(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Enter your name' };
  if (trimmed.length > 32) return { ok: false, error: 'Name must be 32 characters or less' };
  return { ok: true, value: trimmed };
}
