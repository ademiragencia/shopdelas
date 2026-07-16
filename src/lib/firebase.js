import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config PÚBLICA do Firebase (pode ficar no front-end — a segurança é feita
// pelas Regras do Firestore). Pode ser sobrescrita por variáveis de ambiente.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxZVydc7czX5dhglTZDIadroGo8FVjQUc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "viste-c991e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "viste-c991e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "viste-c991e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || "956056370732",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:956056370732:web:78ef6346c02d31fc915b89",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseReady = true;
