import { collection, getDocs, limit, orderBy, query, startAfter } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore';
import type { ActivityLog } from '../types';
import { firebase } from './firebase';
export type HistoryCursor = QueryDocumentSnapshot<DocumentData>;
export async function loadHistory(cursor?: HistoryCursor) {
  const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc'), limit(50)];
  if (cursor) constraints.push(startAfter(cursor));
  const result = await getDocs(query(collection(firebase().db, 'audit'), ...constraints));
  return {
    items: result.docs.map((d) => d.data() as ActivityLog),
    cursor: result.docs.at(-1),
    more: result.size === 50,
  };
}
