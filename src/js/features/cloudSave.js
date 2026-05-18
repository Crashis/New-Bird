import { auth, db } from '../../firebase.js';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

const USERS_COLLECTION = 'users';
const CLOUD_SAVE_VERSION = 1;
const DEBOUNCE_MS = 7000;

let currentUid = null;
let lastStatus = 'idle';
let lastError = null;
let pendingTimer = null;
let pendingReason = null;
let lastSavedAt = 0;
let isFlushing = false;
const statusListeners = new Set();

function setStatus(status, error = null) {
  lastStatus = status;
  lastError = error;
  for (const fn of statusListeners) {
    try { fn(status, error); } catch (e) {}
  }
}

export function getCloudSaveStatus() {
  return { status: lastStatus, error: lastError, lastSavedAt };
}

export function subscribeCloudSaveStatus(fn) {
  if (typeof fn !== 'function') return () => {};
  statusListeners.add(fn);
  try { fn(lastStatus, lastError); } catch (e) {}
  return () => statusListeners.delete(fn);
}

function isAvailable() {
  return !!(auth && db && currentUid);
}

export function initCloudSave({ uid } = {}) {
  if (!auth || !db) {
    setStatus('disabled');
    return false;
  }
  currentUid = uid || (auth.currentUser && auth.currentUser.uid) || null;
  if (!currentUid) {
    setStatus('disabled');
    return false;
  }
  setStatus('ready');
  return true;
}

export async function hasCloudSave() {
  if (!isAvailable()) return false;
  try {
    const ref = doc(db, USERS_COLLECTION, currentUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const data = snap.data() || {};
    return data.hasCloudSave === true;
  } catch (error) {
    console.warn('[cloudSave] hasCloudSave failed', error);
    setStatus('error', error);
    return false;
  }
}

export async function loadCloudProgress() {
  if (!isAvailable()) return null;
  try {
    const ref = doc(db, USERS_COLLECTION, currentUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() || {};
    return data.progress || null;
  } catch (error) {
    console.warn('[cloudSave] loadCloudProgress failed', error);
    setStatus('error', error);
    return null;
  }
}

export async function saveCloudProgress(snapshot, reason = 'manual') {
  if (!isAvailable()) return false;
  if (!snapshot || typeof snapshot !== 'object') return false;
  setStatus('saving');
  try {
    const ref = doc(db, USERS_COLLECTION, currentUid);
    let displayName = '';
    try {
      if (window.NWLeaderboard && typeof window.NWLeaderboard.getCurrentDisplayName === 'function') {
        displayName = window.NWLeaderboard.getCurrentDisplayName() || '';
      }
    } catch (e) {}
    const payload = {
      uid: currentUid,
      displayName: String(displayName || '').slice(0, 20),
      cloudSaveVersion: CLOUD_SAVE_VERSION,
      hasCloudSave: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      progress: snapshot
    };
    await setDoc(ref, payload, { merge: true });
    lastSavedAt = Date.now();
    setStatus('synced');
    console.log('[cloudSave] saved', { reason });
    return true;
  } catch (error) {
    console.warn('[cloudSave] saveCloudProgress failed', error);
    setStatus('error', error);
    return false;
  }
}

export async function uploadLocalProgressToCloud(reason = 'migration') {
  if (!window.NWProgressSnapshot) return false;
  const snap = window.NWProgressSnapshot.readLocalProgressSnapshot();
  return saveCloudProgress(snap, reason);
}

export async function downloadCloudProgressToLocal() {
  const cloud = await loadCloudProgress();
  if (!cloud) return false;
  if (window.NWProgressSnapshot && typeof window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage === 'function') {
    window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage(cloud);
    return true;
  }
  return false;
}

export async function resetCloudProgressToDefaults(reason = 'reset') {
  if (!isAvailable()) return false;
  if (!window.NWProgressSnapshot || typeof window.NWProgressSnapshot.createDefaultProgressSnapshot !== 'function') return false;
  const fresh = window.NWProgressSnapshot.createDefaultProgressSnapshot();
  return saveCloudProgress(fresh, reason);
}

export function queueCloudSave(reason = 'autosave') {
  if (!isAvailable()) return;
  pendingReason = reason;
  if (pendingTimer || isFlushing) return;
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    const r = pendingReason || 'autosave';
    pendingReason = null;
    flushCloudSave(r);
  }, DEBOUNCE_MS);
}

export async function flushCloudSave(reason = 'flush') {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingReason = null;
  }
  if (!isAvailable()) return false;
  if (!window.NWProgressSnapshot) return false;
  if (isFlushing) return false;
  isFlushing = true;
  try {
    const snap = window.NWProgressSnapshot.readLocalProgressSnapshot();
    return await saveCloudProgress(snap, reason);
  } finally {
    isFlushing = false;
  }
}

if (typeof window !== 'undefined') {
  window.NWCloudSave = {
    initCloudSave,
    getCloudSaveStatus,
    subscribeCloudSaveStatus,
    hasCloudSave,
    loadCloudProgress,
    saveCloudProgress,
    uploadLocalProgressToCloud,
    downloadCloudProgressToLocal,
    queueCloudSave,
    flushCloudSave,
    resetCloudProgressToDefaults
  };
}
