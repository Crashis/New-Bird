import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
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
    // Persist the Google/anonymous session in localStorage so the user stays
    // signed in across reloads and browser restarts.
    setPersistence(auth, browserLocalPersistence).catch(error => {
      console.warn('[firebase] setPersistence failed', error);
    });
  } catch (error) {
    console.warn('[firebase] init failed', error);
  }
} else {
  console.warn('[firebase] config is missing; online leaderboard disabled');
}

// Promise sdílená napříč voláními, aby se anonymous sign-in nikdy nespustil 2×
// paralelně. Vrací aktuálního usera, případně se anonymně přihlásí.
let ensureAuthPromise = null;
export function ensureAuth() {
  if (!auth) {
    return Promise.reject(new Error('Firebase auth není k dispozici (chybí konfigurace).'));
  }
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (ensureAuthPromise) return ensureAuthPromise;

  ensureAuthPromise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => { if (!settled) { settled = true; fn(value); } };

    // Čekej na obnovený session z localStorage.
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        try { unsub(); } catch (e) {}
        if (user) {
          console.log('[firebase] auth restored:', user.uid, user.isAnonymous ? '(anon)' : '(google)');
          return finish(resolve, user);
        }
        try {
          console.log('[firebase] no session, signing in anonymously…');
          const cred = await signInAnonymously(auth);
          console.log('[firebase] anonymous sign-in success:', cred.user?.uid);
          finish(resolve, cred.user);
        } catch (err) {
          console.error('[firebase] anonymous sign-in failed', err);
          finish(reject, err);
        }
      },
      (err) => {
        try { unsub(); } catch (e) {}
        console.error('[firebase] onAuthStateChanged error', err);
        finish(reject, err);
      }
    );
  }).catch((err) => {
    ensureAuthPromise = null; // umožni další pokus
    throw err;
  });

  return ensureAuthPromise;
}

if (auth) {
  onAuthStateChanged(auth, (user) => {
    console.log('[firebase] auth state changed:', user ? user.uid : '(none)');
    if (!user) ensureAuthPromise = null;
  });
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
  setPersistence,
  browserLocalPersistence,
  signInAnonymously,
  GoogleAuthProvider,
  linkWithPopup,
  signInWithPopup,
  signOut
};

export { firebaseConfig };
