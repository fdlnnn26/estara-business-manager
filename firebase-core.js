import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, writeBatch, increment } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const cfg = await (await fetch('/api/config')).json();
export const app = initializeApp(cfg), auth = getAuth(app), db = getFirestore(app);
export const col = n => collection(db, 'businesses', auth.currentUser.uid, n);
export const token = () => auth.currentUser.getIdToken();
export const google = () => signInWithPopup(auth, new GoogleAuthProvider());
export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, writeBatch, increment };
