import { auth, db, firebaseSDK } from '../../firebase.js';

const LEADERBOARD_COLLECTION = 'leaderboard';

let currentUid = null;

function warn(message, error) {
  console.warn(`[leaderboard] ${message}`, error || '');
}

function getLeaderboardApi() {
  return window.NWLeaderboard || null;
}

function getSafeScore(score) {
  const api = getLeaderboardApi();
  return api && typeof api.validateScore === 'function' ? api.validateScore(score) : null;
}

function getSafeDisplayName(displayName) {
  const api = getLeaderboardApi();
  return api && typeof api.sanitizeDisplayName === 'function'
    ? api.sanitizeDisplayName(displayName)
    : 'Anonymní hráč';
}

async function submitBestScore(score, displayName) {
  const validScore = getSafeScore(score);
  if (validScore === null) return;
  if (!currentUid || !db) return;
  const safeName = getSafeDisplayName(displayName);
  const ref = firebaseSDK.doc(db, LEADERBOARD_COLLECTION, currentUid);

  await firebaseSDK.runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const now = firebaseSDK.serverTimestamp();
    if (!snapshot.exists()) {
      transaction.set(ref, {
        uid: currentUid,
        displayName: safeName,
        bestScore: validScore,
        createdAt: now,
        updatedAt: now
      });
      return;
    }

    const data = snapshot.data() || {};
    const storedBest = typeof data.bestScore === 'number' ? data.bestScore : 0;
    if (validScore > storedBest) {
      transaction.update(ref, {
        displayName: safeName,
        bestScore: validScore,
        updatedAt: now
      });
    }
  });
}

async function updateDisplayName(displayName) {
  if (!currentUid || !db) return false;
  const safeName = getSafeDisplayName(displayName);
  const ref = firebaseSDK.doc(db, LEADERBOARD_COLLECTION, currentUid);
  try {
    await firebaseSDK.runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) return;
      const now = firebaseSDK.serverTimestamp();
      transaction.update(ref, {
        displayName: safeName,
        updatedAt: now
      });
    });
    return true;
  } catch (error) {
    warn('displayName update failed', error);
    return false;
  }
}

async function fetchTopScores() {
  if (!db) return [];
  const leaderboardQuery = firebaseSDK.query(
    firebaseSDK.collection(db, LEADERBOARD_COLLECTION),
    firebaseSDK.orderBy('bestScore', 'desc'),
    firebaseSDK.limit(10)
  );
  const snapshot = await firebaseSDK.getDocs(leaderboardQuery);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() || {};
    return {
      uid: typeof data.uid === 'string' ? data.uid : docSnap.id,
      displayName: getSafeDisplayName(data.displayName),
      bestScore: getSafeScore(data.bestScore) ?? 0
    };
  });
}

function installLeaderboardService() {
  const api = getLeaderboardApi();
  if (!api || typeof api.setOnlineService !== 'function') return;
  api.setOnlineService({
    getUid: () => currentUid,
    submitBestScore,
    updateDisplayName,
    fetchTopScores
  });
}

// Wait until Firebase has finished restoring a persisted session from
// localStorage. On a cold page load `auth.currentUser` is `null` until this
// settles — without this gate we'd race and call signInAnonymously() before
// the persisted Google user comes back, replacing it with a fresh anon UID.
function waitForInitialAuthState() {
  return new Promise(resolve => {
    const unsubscribe = firebaseSDK.onAuthStateChanged(auth, user => {
      try { unsubscribe(); } catch (e) {}
      resolve(user || null);
    }, error => {
      try { unsubscribe(); } catch (e) {}
      warn('initial auth state failed', error);
      resolve(null);
    });
  });
}

export async function initLeaderboardAuth() {
  if (!auth || !db) {
    warn('Firebase unavailable; online features disabled');
    return null;
  }

  installLeaderboardService();
  try {
    // Keep currentUid in sync for the rest of the session (sign-in / sign-out).
    firebaseSDK.onAuthStateChanged(auth, user => {
      currentUid = user ? user.uid : null;
    });

    const restoredUser = auth.currentUser || await waitForInitialAuthState();
    if (restoredUser) {
      currentUid = restoredUser.uid;
      return currentUid;
    }

    // No persisted session — fall back to anonymous so the leaderboard still
    // works for first-time players.
    const credential = await firebaseSDK.signInAnonymously(auth);
    currentUid = credential && credential.user ? credential.user.uid : null;
    return currentUid;
  } catch (error) {
    currentUid = null;
    warn('auth init failed', error);
    return null;
  }
}

export { LEADERBOARD_COLLECTION, fetchTopScores, submitBestScore, updateDisplayName };
