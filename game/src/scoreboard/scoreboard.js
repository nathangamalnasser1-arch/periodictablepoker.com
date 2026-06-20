import {
  collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase.js';

export const MOLECULE_BOARD_ID = 'ptp-molecules';

export const MOLECULE_REASONS = new Set(['nacl', 'h2o', 'chonp']);

export function isMoleculeWin(winnerReason) {
  return MOLECULE_REASONS.has(winnerReason);
}

export function moleculeLabel(reason) {
  if (reason === 'nacl') return 'NaCl';
  if (reason === 'h2o') return 'H₂O';
  if (reason === 'chonp') return 'CHONP';
  return '';
}

export function validateDisplayName(name) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return { ok: false, error: 'Enter your name' };
  if (trimmed.length > 32) return { ok: false, error: 'Name must be 32 characters or less' };
  return { ok: true, value: trimmed };
}

/** Whether to show the in-game molecule scoreboard submit form. */
export function shouldShowMoleculeScoreboard({
  isShowdown,
  humanIndex,
  winnerIndex,
  winnerIndices,
  winnerReason,
  gameNumber,
  isMultiplayer,
}) {
  if (!isShowdown || isMultiplayer) return false;
  if (gameNumber < 4) return false;
  if (!isMoleculeWin(winnerReason)) return false;
  const indices = (winnerIndices?.length ? winnerIndices : (winnerIndex != null ? [winnerIndex] : []));
  return indices.includes(humanIndex);
}

export function timestampToMs(submittedAt) {
  if (!submittedAt) return 0;
  if (typeof submittedAt.toMillis === 'function') return submittedAt.toMillis();
  if (submittedAt.seconds != null) return submittedAt.seconds * 1000;
  if (submittedAt instanceof Date) return submittedAt.getTime();
  return 0;
}

export function formatScoreDate(submittedAt) {
  const ms = timestampToMs(submittedAt);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function sortScoresByDateDesc(scores) {
  return [...scores].sort((a, b) => (b.submittedAtMs ?? 0) - (a.submittedAtMs ?? 0));
}

export function groupScoresByMolecule(scores) {
  const groups = { chonp: [], h2o: [], nacl: [] };
  for (const s of scores) {
    if (groups[s.molecule]) groups[s.molecule].push(s);
  }
  for (const key of Object.keys(groups)) {
    groups[key] = sortScoresByDateDesc(groups[key]);
  }
  return groups;
}

export function mapScoreDoc(id, data) {
  return {
    id,
    displayName: data.displayName ?? 'Anonymous',
    molecule: data.molecule,
    gameNumber: data.gameNumber ?? 0,
    handWeight: data.handWeight ?? 0,
    uid: data.uid ?? '',
    submittedAt: data.submittedAt ?? null,
    submittedAtMs: timestampToMs(data.submittedAt),
  };
}

async function ensureAuthUid() {
  if (auth.currentUser) return auth.currentUser.uid;
  const { user } = await signInAnonymously(auth);
  return user.uid;
}

export async function submitMoleculeScore({ displayName, molecule, gameNumber, handWeight }) {
  const validated = validateDisplayName(displayName);
  if (!validated.ok) throw new Error(validated.error);
  if (!isMoleculeWin(molecule)) throw new Error('Only NaCl, H₂O, and CHONP wins can be submitted');

  const uid = await ensureAuthUid();
  const ref = collection(db, 'leaderboards', MOLECULE_BOARD_ID, 'scores');
  await addDoc(ref, {
    displayName: validated.value,
    molecule,
    gameNumber,
    handWeight,
    uid,
    submittedAt: serverTimestamp(),
  });
}

export async function fetchMoleculeScores(max = 100) {
  const ref = collection(db, 'leaderboards', MOLECULE_BOARD_ID, 'scores');
  const q = query(ref, orderBy('submittedAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapScoreDoc(d.id, d.data()));
}
