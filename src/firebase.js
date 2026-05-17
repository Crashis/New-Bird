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

// This static project does not have a bundler-backed env system right now.
// Paste your Firebase web app config here, or set window.__FIREBASE_CONFIG__
// before src/js/main.js loads.
const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  appId: '...'
};

function readEnvConfig() {
  const env = import.meta.env || {};
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
  return Object.values(config).every(Boolean) ? config : null;
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
    config.appId &&
    !String(config.apiKey).includes('...')
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
