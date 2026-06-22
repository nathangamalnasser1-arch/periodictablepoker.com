import {
  collection, getDocs, query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { LEDGER_ID, mapLedgerDoc } from './ledger.js';

export async function fetchLedgerEvents(max = 200) {
  const ref = collection(db, 'ledger', LEDGER_ID, 'events');
  const q = query(ref, orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapLedgerDoc(d.id, d.data()));
}
