/**
 * Create/join/start a 2-player game and play one full hand + next deal.
 * Run with emulators: node scripts/play-hand-emulator.mjs
 */
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, doc, updateDoc, getDoc,
  query, where, limit, getDocs, serverTimestamp, connectFirestoreEmulator,
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  dealGame, playerAction, advanceBettingRound, isBettingRoundComplete, PHASES,
} from '../src/game/gameLogic.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dir, '../.env'), 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
);

const cfg = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const COL = 'poker-games';

async function makeClient(label) {
  const app = initializeApp(cfg, label);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const { user } = await signInAnonymously(auth);
  return { app, db, uid: user.uid, label };
}

const host = await makeClient('host');
const guest = await makeClient('guest');
const keyword = `sim-hand-${Date.now()}`;
const ref = await addDoc(collection(host.db, COL), {
  name: 'Sim Hand Room',
  keyword,
  createdBy: host.uid,
  playerIds: [host.uid, null, null, null, null],
  playerNames: ['Host-Sim', null, null, null, null],
  status: 'waiting',
  createdAt: serverTimestamp(),
});

const snap = await getDocs(
  query(collection(guest.db, COL), where('keyword', '==', keyword), where('status', '==', 'waiting'), limit(1))
);
const gameDoc = snap.docs[0];
const ids = [...gameDoc.data().playerIds];
const names = [...gameDoc.data().playerNames];
ids[1] = guest.uid;
names[1] = 'Guest-Sim';
await updateDoc(gameDoc.ref, { playerIds: ids, playerNames: names });

let state = dealGame(2, 4);
await updateDoc(doc(host.db, COL, ref.id), {
  status: 'playing',
  numPlayers: 2,
  currentState: JSON.parse(JSON.stringify(state)),
});
const gameRef = doc(host.db, COL, ref.id);

console.log('keyword:', keyword);
console.log('Start:', state.phase, 'pot', state.pot, 'SB/BB posted');

const streetLog = [];
while (state.phase !== PHASES.SHOWDOWN) {
  const idx = state.currentPlayerIndex;
  const actor = idx === 0 ? host : guest;
  const toCall = state.currentBet - (state.roundBets[idx] || 0);
  state = playerAction(state, idx, toCall > 0 ? 'call' : 'check');
  if (isBettingRoundComplete(state)) state = advanceBettingRound(state, state.gameNumber);
  await updateDoc(gameRef, { currentState: JSON.parse(JSON.stringify(state)) });
  const other = idx === 0 ? guest : host;
  const synced = (await getDoc(doc(other.db, COL, ref.id))).data().currentState;
  if (synced.phase !== state.phase || synced.pot !== state.pot) {
    throw new Error(`Sync fail at ${state.phase}`);
  }
  streetLog.push(`${state.phase}(pot${state.pot},cc${state.communityCards?.length || 0})`);
}

console.log('SHOWDOWN winner', state.winnerIndex, state.winnerReason);
console.log('Streets:', streetLog.filter((s, i, a) => i === 0 || s !== a[i - 1]).join(' -> '));

const next = dealGame(2, 5, undefined, null, state.players.map((p) => p.chips));
await updateDoc(gameRef, { currentState: JSON.parse(JSON.stringify(next)) });
const nextSync = (await getDoc(doc(guest.db, COL, ref.id))).data().currentState;
console.log('Next hand gameNumber', nextSync.gameNumber, 'phase', nextSync.phase);

await deleteApp(host.app);
await deleteApp(guest.app);
console.log('PASS full hand + next hand');
