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
    fetchTopScores
  });
}

export async function initLeaderboardAuth() {
  if (!auth || !db) {
    warn('Firebase unavailable; online features disabled');
    return null;
  }

  installLeaderboardService();
  try {
    firebaseSDK.onAuthStateChanged(auth, user => {
      currentUid = user ? user.uid : null;
    });

    if (auth.currentUser) {
      currentUid = auth.currentUser.uid;
      return currentUid;
    }

    const credential = await firebaseSDK.signInAnonymously(auth);
    currentUid = credential && credential.user ? credential.user.uid : null;
    return currentUid;
  } catch (error) {
    currentUid = null;
    warn('anonymous auth failed', error);
    return null;
  }
}

export { LEADERBOARD_COLLECTION, fetchTopScores, submitBestScore };
