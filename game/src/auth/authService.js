import {
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase.js';
import { upsertUserFromAuth, finalizeSubscriber } from './userProfile.js';

const googleProvider = new GoogleAuthProvider();

export function formatAuthError(err) {
  const code = err?.code ?? '';
  const msg = err?.message ?? String(err);
  if (code === 'auth/popup-closed-by-user') return 'Sign-in cancelled.';
  if (code === 'auth/credential-already-in-use') {
    return 'That account is already linked to another user. Sign in with that method instead.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a moment and try again.';
  return msg.replace(/^Firebase: Error \([^)]+\)\.\s*/i, '');
}

async function linkOrSignInWithPopup(provider) {
  const current = auth.currentUser;
  if (current?.isAnonymous) {
    try {
      const { user } = await linkWithPopup(current, provider);
      return user;
    } catch (err) {
      if (err?.code === 'auth/credential-already-in-use') {
        const { user } = await signInWithPopup(auth, provider);
        return user;
      }
      throw err;
    }
  }
  const { user } = await signInWithPopup(auth, provider);
  return user;
}

export async function signInAsGuest() {
  const { user } = await signInAnonymously(auth);
  return user;
}

export async function signInWithGoogle() {
  const user = await linkOrSignInWithPopup(googleProvider);
  await sendEmailVerificationIfNeeded(user);
  let profile = await upsertUserFromAuth(user);
  profile = await finalizeSubscriber(user, profile);
  return { user, profile };
}

async function sendEmailVerificationIfNeeded(user) {
  if (user.email && !user.emailVerified && !user.providerData.some((p) => p.providerId === 'google.com')) {
    await sendEmailVerification(user);
  }
}

export async function registerWithEmail(email, password) {
  const current = auth.currentUser;
  let user;
  if (current?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    const { user: linked } = await linkWithCredential(current, credential);
    user = linked;
  } else {
    const { user: created } = await createUserWithEmailAndPassword(auth, email, password);
    user = created;
  }
  await sendEmailVerification(user);
  const profile = await upsertUserFromAuth(user);
  return { user, profile };
}

export async function signInWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  let profile = await upsertUserFromAuth(user);
  profile = await finalizeSubscriber(user, profile);
  return { user, profile };
}

export async function refreshEmailVerification(user) {
  await user.reload();
  const refreshed = auth.currentUser;
  let profile = await upsertUserFromAuth(refreshed);
  profile = await finalizeSubscriber(refreshed, profile);
  return { user: refreshed, profile };
}

export async function resendVerificationEmail(user) {
  await sendEmailVerification(user);
}

export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function signOutUser() {
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}
