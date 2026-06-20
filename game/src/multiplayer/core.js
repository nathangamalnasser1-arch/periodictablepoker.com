import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  getDoc, query, where, limit, getDocs, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase.js';

const COLLECTION = 'poker-games';
const GAME_TTL_MS = 30 * 60 * 1000;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

export function slug(name) {
  return name.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 24) || 'game';
}

export function expired(createdAt) {
  if (!createdAt) return false;
  const ms = createdAt.toMillis ? createdAt.toMillis() : (createdAt.seconds ?? 0) * 1000;
  return Date.now() - ms > GAME_TTL_MS;
}

export function clean(obj) {
  return JSON.parse(JSON.stringify(obj ?? null));
}

export function hasOpenSlot(game) {
  const ids = game?.playerIds ?? [];
  return ids.some(id => !id);
}

function listJoinableGames(docs) {
  return docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(g => !expired(g.createdAt))
    .filter(hasOpenSlot);
}

export class MultiplayerSession {
  constructor() {
    this.gameId = null;
    this.playerIndex = -1;
    this.uid = null;
    this._unsub = null;
    this._ready = new Promise(resolve =>
      onAuthStateChanged(auth, user => { this.uid = user?.uid ?? null; resolve(); })
    );
  }

  async ensureAuth() {
    return this._auth();
  }

  async _auth() {
    await this._ready;
    if (!this.uid) {
      const { user } = await signInAnonymously(auth);
      this.uid = user.uid;
    }
    return this.uid;
  }

  _guestName() {
    const key = `ptp_guest_${this.uid}`;
    let n = localStorage.getItem(key);
    if (!n) {
      n = `Player-${1000 + Math.floor(Math.random() * 9000)}`;
      localStorage.setItem(key, n);
    }
    return n;
  }

  async create(gameName, { openCards = false } = {}) {
    await this._auth();
    const keyword = slug(gameName);
    const ids = [this.uid, null, null, null, null];
    const names = [this._guestName(), null, null, null, null];
    const ref = await addDoc(collection(db, COLLECTION), {
      name: gameName,
      keyword,
      createdBy: this.uid,
      playerIds: ids,
      playerNames: names,
      status: 'waiting',
      openCards: !!openCards,
      createdAt: serverTimestamp(),
    });
    this.gameId = ref.id;
    this.playerIndex = 0;
    return { gameId: ref.id, keyword, playerIndex: 0 };
  }

  async join(keyword) {
    await this._auth();
    const k = slug(keyword);
    const snap = await getDocs(
      query(collection(db, COLLECTION), where('keyword', '==', k), where('status', '==', 'waiting'), limit(1))
    );
    if (snap.empty) throw new Error('No waiting game with that keyword.');
    const d = snap.docs[0];
    const data = d.data();
    if (expired(data.createdAt)) throw new Error('Game expired (30-minute limit).');
    const ids = [...(data.playerIds ?? [])];
    const names = [...(data.playerNames ?? [])];
    const existing = ids.indexOf(this.uid);
    if (existing !== -1) {
      this.gameId = d.id;
      this.playerIndex = existing;
      return { gameId: d.id, playerIndex: existing };
    }
    const slot = ids.indexOf(null);
    if (slot === -1) throw new Error('Game is full.');
    ids[slot] = this.uid;
    names[slot] = this._guestName();
    await updateDoc(d.ref, { playerIds: ids, playerNames: names });
    this.gameId = d.id;
    this.playerIndex = slot;
    return { gameId: d.id, playerIndex: slot };
  }

  async start(initialState) {
    if (!this.gameId || this.playerIndex !== 0) throw new Error('Only the host can start.');
    const ref = doc(db, COLLECTION, this.gameId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const count = (data.playerIds ?? []).filter(Boolean).length;
    if (count < MIN_PLAYERS) throw new Error(`Need at least ${MIN_PLAYERS} players to start.`);
    await updateDoc(ref, {
      status: 'playing',
      numPlayers: count,
      currentState: clean(initialState),
    });
  }

  async write(state) {
    if (!this.gameId) return;
    await updateDoc(doc(db, COLLECTION, this.gameId), { currentState: clean(state) });
  }

  subscribe(onState, onStatus) {
    if (!this.gameId) return () => {};
    const ref = doc(db, COLLECTION, this.gameId);
    this._unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) { onStatus?.('gone'); return; }
      const data = snap.data();
      if (data.status === 'waiting') { onStatus?.('waiting', data); return; }
      if (data.status === 'playing') {
        onStatus?.('playing', data);
        if (data.currentState) onState?.(data.currentState, data);
      }
    });
    return this._unsub;
  }

  async leave() {
    if (!this.gameId) return;
    const ref = doc(db, COLLECTION, this.gameId);
    const snap = await getDoc(ref);
    if (!snap.exists()) { this._reset(); return; }
    const data = snap.data();
    if (data.status !== 'waiting') { this._reset(); return; }
    const ids = [...(data.playerIds ?? [])];
    const names = [...(data.playerNames ?? [])];
    const idx = ids.indexOf(this.uid);
    if (idx !== -1) { ids[idx] = null; names[idx] = null; }
    if (ids.every(x => !x)) await deleteDoc(ref);
    else await updateDoc(ref, { playerIds: ids, playerNames: names });
    this._reset();
  }

  async fetchWaiting() {
    await this._auth();
    const snap = await getDocs(query(collection(db, COLLECTION), where('status', '==', 'waiting')));
    return listJoinableGames(snap.docs);
  }

  subscribeWaiting(onGames) {
    const q = query(collection(db, COLLECTION), where('status', '==', 'waiting'));
    return onSnapshot(q, snap => onGames?.(listJoinableGames(snap.docs)));
  }

  _reset() {
    this._unsub?.();
    this._unsub = null;
    this.gameId = null;
    this.playerIndex = -1;
  }
}

export const session = new MultiplayerSession();
