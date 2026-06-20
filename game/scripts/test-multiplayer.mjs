/**
 * Integration smoke test: two anonymous Firebase users create/join/start a game.
 * Run: node scripts/test-multiplayer.mjs
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

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const COLLECTION = 'poker-games';

const useEmulator = process.env.USE_FIREBASE_EMULATOR === 'true'
  || env.VITE_USE_FIREBASE_EMULATOR === 'true';

async function makeClient(label) {
  const app = initializeApp(firebaseConfig, label);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  const { user } = await signInAnonymously(auth);
  return { app, auth, db, uid: user.uid, label };
}

function slug(name) {
  return name.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 24) || 'game';
}

async function run() {
  console.log('Creating two anonymous clients…');
  const host = await makeClient('host');
  const guest = await makeClient('guest');
  console.log(`Host uid: ${host.uid}`);
  console.log(`Guest uid: ${guest.uid}`);

  const gameName = `Test Room ${Date.now()}`;
  const keyword = slug(gameName);
  const ids = [host.uid, null, null, null, null];
  const names = ['Host-Player', null, null, null, null];

  const ref = await addDoc(collection(host.db, COLLECTION), {
    name: gameName,
    keyword,
    createdBy: host.uid,
    playerIds: ids,
    playerNames: names,
    status: 'waiting',
    createdAt: serverTimestamp(),
  });
  console.log(`Created game ${ref.id} keyword=${keyword}`);

  const snap = await getDocs(
    query(
      collection(guest.db, COLLECTION),
      where('keyword', '==', keyword),
      where('status', '==', 'waiting'),
      limit(1)
    )
  );
  if (snap.empty) throw new Error('Guest could not find waiting game');
  const gameDoc = snap.docs[0];
  const data = gameDoc.data();
  const guestIds = [...data.playerIds];
  const guestNames = [...data.playerNames];
  const slot = guestIds.indexOf(null);
  guestIds[slot] = guest.uid;
  guestNames[slot] = 'Guest-Player';
  await updateDoc(gameDoc.ref, { playerIds: guestIds, playerNames: guestNames });
  console.log(`Guest joined slot ${slot}`);

  const count = guestIds.filter(Boolean).length;
  const startState = { phase: 'preflop', players: [{ chips: 1000 }, { chips: 1000 }], pot: 30 };
  await updateDoc(doc(host.db, COLLECTION, ref.id), {
    status: 'playing',
    numPlayers: count,
    currentState: startState,
  });
  console.log('Host started game');

  const after = await getDoc(doc(guest.db, COLLECTION, ref.id));
  const afterData = after.data();
  if (afterData.status !== 'playing' || afterData.numPlayers !== 2) {
    throw new Error(`Expected playing with 2 players, got ${afterData.status} / ${afterData.numPlayers}`);
  }
  console.log('Guest sees playing state with numPlayers=2');

  // Host writes an action; guest should see updated state via snapshot-like read
  const actionState = { ...startState, pot: 50, lastAction: { playerIndex: 0, action: 'check' } };
  await updateDoc(doc(host.db, COLLECTION, ref.id), { currentState: actionState });
  const synced = await getDoc(doc(guest.db, COLLECTION, ref.id));
  const syncedState = synced.data()?.currentState;
  if (syncedState?.pot !== 50) throw new Error('Guest did not receive state sync after action');
  console.log('State sync after action: OK');

  await deleteApp(host.app);
  await deleteApp(guest.app);
  console.log('PASS: multiplayer create/join/start flow');
}

run().catch((e) => {
  console.error('FAIL:', e.message || e);
  process.exit(1);
});
