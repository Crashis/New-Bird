import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

// This static project has no bundler-backed env system. The recommended way
// to provide Firebase config is to copy `src/firebase.config.local.example.js`
// to `src/firebase.config.local.js` (gitignored) and load it from index.html
// before `src/js/main.js`. It sets `window.__FIREBASE_CONFIG__`.
// Never commit real keys into this file.
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};

function readEnvConfig() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
  return config.apiKey && config.projectId && config.appId ? config : null;
}

function readWindowConfig() {
  if (typeof window === 'undefined') return null;
  const config = window.__FIREBASE_CONFIG__;
  if (!config || typeof config !== 'object') return null;
  return config;
}

function hasUsableConfig(config) {
  return !!(
    config &&
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId
  );
}

export const resolvedFirebaseConfig = readEnvConfig() || readWindowConfig() || firebaseConfig;

export let app = null;
export let auth = null;
export let db = null;

if (hasUsableConfig(resolvedFirebaseConfig)) {
  try {
    app = getApps().length ? getApp() : initializeApp(resolvedFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.warn('[firebase] init failed', error);
  }
} else {
  console.warn('[firebase] config is missing; online leaderboard disabled');
}

export const firebaseSDK = {
  collection,
  doc,
  getDocs,
  limit,
  onAuthStateChanged,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  signInAnonymously
};

export { firebaseConfig };
