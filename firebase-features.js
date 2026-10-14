import { db, auth, col, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, writeBatch, increment } from './firebase-core.js';
export const S = { biz: {}, prods: [], trx: [], exp: [], inv: [] };
const rows = async n => (await getDocs(query(col(n), orderBy('at', 'desc')))).docs.map(d => ({ id: d.id, ...d.data() }));
export async function loadAll() {
  const b = await getDoc(doc(db, 'businesses', auth.currentUser.uid));
  S.biz = b.exists() ? b.data() : {};
  [S.prods, S.trx, S.exp, S.inv] = await Promise.all(['products', 'transactions', 'expenses', 'invoices'].map(rows));
}
export const saveBiz = async d => { S.biz = { ...S.biz, ...d }; await setDoc(doc(db, 'businesses', auth.currentUser.uid), S.biz, { merge: true }); };
export const addProduct = async p => { await addDoc(col('products'), { ...p, at: Date.now() }); await loadAll(); };
export const stockIn = async (id, q) => { await updateDoc(doc(col('products'), id), { stock: increment(q) }); await loadAll(); };
export async function checkout(t) {
  const b = writeBatch(db);
  b.set(doc(col('transactions')), t);
  t.items.forEach(i => b.update(doc(col('products'), i.id), { stock: increment(-i.qty) }));
  await b.commit(); await loadAll();
}
export const addExpense = async e => { await addDoc(col('expenses'), { ...e, at: Date.now() }); await loadAll(); };
export const addInvoice = async i => { await addDoc(col('invoices'), { ...i, at: Date.now() }); await loadAll(); };
export const setInvStatus = async (id, status) => { await updateDoc(doc(col('invoices'), id), { status }); await loadAll(); };
