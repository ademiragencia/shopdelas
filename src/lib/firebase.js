import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config PÚBLICA do Firebase (pode ficar no front-end — a segurança é feita
// pelas Regras do Firestore). Pode ser sobrescrita por variáveis de ambiente.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "COLE_AQUI_apiKey",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "COLE_AQUI.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "COLE_AQUI_projectId",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "COLE_AQUI.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || "COLE_AQUI_senderId",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "COLE_AQUI_appId",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseReady = !firebaseConfig.apiKey.startsWith("COLE_AQUI");
