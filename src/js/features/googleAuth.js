import { auth, firebaseSDK } from '../../firebase.js';

const listeners = new Set();
let currentUser = null;

function warn(msg, err) { console.warn(`[googleAuth] ${msg}`, err || ''); }

function snapshot() {
  if (!currentUser) return { signedIn: false, anonymous: false, email: null, displayName: null, uid: null };
  return {
    signedIn: true,
    anonymous: !!currentUser.isAnonymous,
    email: currentUser.email || null,
    displayName: currentUser.displayName || null,
    uid: currentUser.uid || null
  };
}

function emit() {
  const snap = snapshot();
  for (const fn of listeners) {
    try { fn(snap); } catch (e) { /* ignore */ }
  }
}

export function getCurrentAuthUser() {
  return currentUser;
}

export function isAnonymousUser() {
  return !!(currentUser && currentUser.isAnonymous);
}

export function getAuthState() {
  return snapshot();
}

export function subscribeAuthState(fn) {
  if (typeof fn !== 'function') return () => {};
  listeners.add(fn);
  try { fn(snapshot()); } catch (e) {}
  return () => listeners.delete(fn);
}

function buildGoogleProvider() {
  const provider = new firebaseSDK.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

function mapAuthError(error) {
  const code = error && error.code ? String(error.code) : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return { kind: 'cancelled', message: 'Přihlášení zrušeno.' };
  }
  if (code === 'auth/popup-blocked') {
    return { kind: 'popup-blocked', message: 'Prohlížeč zablokoval popup. Povol popupy a zkus to znovu.' };
  }
  if (code === 'auth/credential-already-in-use') {
    return {
      kind: 'credential-in-use',
      message: 'Tenhle Google účet už má vlastní save. Přepnutí účtu zatím není automatické.'
    };
  }
  if (code === 'auth/email-already-in-use' || code === 'auth/account-exists-with-different-credential') {
    return {
      kind: 'email-in-use',
      message: 'Tenhle e-mail už patří k jinému účtu. Přepnutí účtu zatím není automatické.'
    };
  }
  if (code === 'auth/operation-not-allowed') {
    return { kind: 'provider-disabled', message: 'Google sign-in není povolen ve Firebase projektu.' };
  }
  if (code === 'auth/network-request-failed') {
    return { kind: 'network', message: 'Chyba sítě. Zkontroluj připojení a zkus to znovu.' };
  }
  return { kind: 'unknown', message: 'Něco se pokazilo. Zkus to prosím znovu.' };
}

export async function linkCurrentAnonymousUserWithGoogle() {
  if (!auth) return { ok: false, error: { kind: 'unavailable', message: 'Firebase auth není dostupný.' } };
  const user = auth.currentUser;
  if (!user) return { ok: false, error: { kind: 'no-user', message: 'Nikdo není přihlášený.' } };
  if (!user.isAnonymous) {
    return { ok: false, error: { kind: 'already-linked', message: 'Účet je už propojený.' } };
  }
  try {
    const provider = buildGoogleProvider();
    const result = await firebaseSDK.linkWithPopup(user, provider);
    currentUser = result && result.user ? result.user : auth.currentUser;
    emit();
    try {
      if (window.NWCloudSave && typeof window.NWCloudSave.flushCloudSave === 'function') {
        await window.NWCloudSave.flushCloudSave('google-link');
      }
    } catch (e) { warn('flush after link failed', e); }
    return { ok: true, user: currentUser };
  } catch (error) {
    warn('linkWithPopup failed', error);
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signInWithGoogle() {
  if (!auth) return { ok: false, error: { kind: 'unavailable', message: 'Firebase auth není dostupný.' } };
  try {
    const provider = buildGoogleProvider();
    const result = await firebaseSDK.signInWithPopup(auth, provider);
    currentUser = result && result.user ? result.user : auth.currentUser;
    emit();
    return { ok: true, user: currentUser };
  } catch (error) {
    warn('signInWithPopup failed', error);
    return { ok: false, error: mapAuthError(error) };
  }
}

export async function signOutUser() {
  if (!auth) return false;
  try {
    await firebaseSDK.signOut(auth);
    currentUser = null;
    emit();
    return true;
  } catch (error) {
    warn('signOut failed', error);
    return false;
  }
}

export function initGoogleAuth() {
  if (!auth) return false;
  currentUser = auth.currentUser || null;
  firebaseSDK.onAuthStateChanged(auth, user => {
    currentUser = user || null;
    emit();
  });
  emit();
  return true;
}

if (typeof window !== 'undefined') {
  window.NWGoogleAuth = {
    initGoogleAuth,
    getAuthState,
    subscribeAuthState,
    isAnonymousUser,
    getCurrentAuthUser,
    linkCurrentAnonymousUserWithGoogle,
    signInWithGoogle,
    signOutUser
  };
}
