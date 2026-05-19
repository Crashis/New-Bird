// Firebase multiplayer service – Fáze 1.
//
// Vrstva mezi UI panelem a Firestore. Spravuje životní cyklus jednoho lobby:
// vytvoření, připojení (transakcí), realtime listener, ready/start, průběžný
// zápis distance/score/alive, výpočet vítěze, rematch, heartbeat a leave.
//
// Záměrně NEzasahuje do herního loopu – herní vrstva sama volá:
//   setLocalProgress({ distance, score, alive }) každý frame/tick
//   markGameStarted() / markPlayerDied() / requestRematch()
// Pokud Firebase není k dispozici, modul tiše nic nedělá a hra běží jako single.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  deleteDoc,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

import { db, auth } from '../../firebase.js';

const LOBBIES_COLLECTION = 'lobbies';
const HEARTBEAT_INTERVAL_MS = 4000;     // jak často píšeme lastSeen
const DISCONNECT_TIMEOUT_MS = 15000;    // po kolika ms považujeme druhého za odpojeného
const PROGRESS_THROTTLE_MS = 750;       // throttle pro průběžné zápisy distance/score

const state = {
  uid: null,
  lobbyCode: null,
  role: null,            // 'host' | 'guest'
  lobby: null,           // poslední snapshot lobby z Firestore
  unsubscribe: null,
  heartbeatTimer: null,
  lastProgressWriteAt: 0,
  pendingProgress: null,
  listeners: new Set(),  // pro on('change', cb)
};

// ──────────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────────

function isAvailable() {
  return !!(db && auth);
}

function generateLobbyCode() {
  // Bez snadno zaměnitelných znaků (0/O, 1/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function makeGameSeed() {
  return Math.floor(Math.random() * 0x7fffffff);
}

function lobbyRef(code) {
  return doc(db, LOBBIES_COLLECTION, code);
}

function makePlayer({ uid, name, ready }) {
  return {
    id: uid,
    name: (name || '').slice(0, 20) || 'Hráč',
    ready: !!ready,
    connected: true,
    distance: 0,
    score: 0,
    alive: true,
    wantsRematch: false,
    lastSeen: Timestamp.now()
  };
}

function emit(eventType, payload) {
  for (const cb of state.listeners) {
    try { cb(eventType, payload, state); } catch (e) { console.warn('[mp] listener', e); }
  }
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

export function getState() {
  return {
    available: isAvailable(),
    uid: state.uid,
    role: state.role,
    lobbyCode: state.lobbyCode,
    lobby: state.lobby
  };
}

export function onChange(cb) {
  state.listeners.add(cb);
  return () => state.listeners.delete(cb);
}

export function initMultiplayer(uid) {
  if (!isAvailable()) return false;
  state.uid = uid || (auth && auth.currentUser && auth.currentUser.uid) || null;
  return !!state.uid;
}

export async function createLobby({ name }) {
  if (!isAvailable() || !state.uid) throw new Error('Multiplayer nedostupný (chybí přihlášení).');

  // Pokus o max. několik kolizí kódu.
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLobbyCode();
    const ref = lobbyRef(code);
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) throw new Error('CODE_TAKEN');
        const host = makePlayer({ uid: state.uid, name, ready: true });
        tx.set(ref, {
          code,
          status: 'waiting',
          hostId: state.uid,
          guestId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          gameSeed: makeGameSeed(),
          players: {
            host,
            guest: null
          }
        });
      });
      state.lobbyCode = code;
      state.role = 'host';
      attachListener(code);
      startHeartbeat();
      return code;
    } catch (e) {
      lastError = e;
      if (e && e.message === 'CODE_TAKEN') continue;
      throw e;
    }
  }
  throw lastError || new Error('Nepodařilo se vytvořit lobby.');
}

export async function joinLobby({ code, name }) {
  if (!isAvailable() || !state.uid) throw new Error('Multiplayer nedostupný (chybí přihlášení).');
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized.length !== 6) throw new Error('Kód lobby musí mít 6 znaků.');

  const ref = lobbyRef(normalized);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Lobby s tímto kódem neexistuje.');
    const data = snap.data() || {};
    if (data.status === 'closed') throw new Error('Lobby je zavřená.');
    if (data.status === 'playing') throw new Error('V této lobby už hra běží.');
    if (data.status === 'finished') throw new Error('Tato lobby už skončila.');
    // Pokud už host = já, prostě se "vrať" jako host – ale to by ošetřilo connected: true.
    if (data.hostId === state.uid) {
      tx.update(ref, {
        'players.host.connected': true,
        'players.host.lastSeen': Timestamp.now(),
        updatedAt: serverTimestamp()
      });
      return;
    }
    if (data.guestId && data.guestId !== state.uid) {
      throw new Error('Lobby je plná.');
    }
    const guest = makePlayer({ uid: state.uid, name, ready: false });
    tx.update(ref, {
      guestId: state.uid,
      'players.guest': guest,
      updatedAt: serverTimestamp()
    });
  });

  state.lobbyCode = normalized;
  state.role = 'guest';
  attachListener(normalized);
  startHeartbeat();
  return normalized;
}

export async function setReady(ready) {
  if (!state.lobbyCode || !state.role) return;
  const ref = lobbyRef(state.lobbyCode);
  const field = state.role === 'host' ? 'players.host.ready' : 'players.guest.ready';
  await updateDoc(ref, {
    [field]: !!ready,
    updatedAt: serverTimestamp()
  });
}

export async function startGame() {
  if (!state.lobbyCode || state.role !== 'host') return;
  const lobby = state.lobby;
  if (!lobby || !lobby.players || !lobby.players.host || !lobby.players.guest) {
    throw new Error('V lobby ještě nejsou oba hráči.');
  }
  if (!lobby.players.host.ready || !lobby.players.guest.ready) {
    throw new Error('Oba hráči musí být ready.');
  }
  const ref = lobbyRef(state.lobbyCode);
  await updateDoc(ref, {
    status: 'playing',
    gameSeed: lobby.gameSeed || makeGameSeed(),
    'players.host.distance': 0,
    'players.host.score': 0,
    'players.host.alive': true,
    'players.host.wantsRematch': false,
    'players.guest.distance': 0,
    'players.guest.score': 0,
    'players.guest.alive': true,
    'players.guest.wantsRematch': false,
    updatedAt: serverTimestamp()
  });
}

export function setLocalProgress({ distance, score, alive }) {
  if (!state.lobbyCode || !state.role) return;
  state.pendingProgress = {
    distance: Math.max(0, Math.floor(distance || 0)),
    score: Math.max(0, Math.floor(score || 0)),
    alive: alive !== false
  };
  const now = Date.now();
  if (now - state.lastProgressWriteAt >= PROGRESS_THROTTLE_MS) {
    flushProgress();
  }
}

async function flushProgress() {
  if (!state.pendingProgress || !state.lobbyCode || !state.role) return;
  const p = state.pendingProgress;
  state.pendingProgress = null;
  state.lastProgressWriteAt = Date.now();
  const ref = lobbyRef(state.lobbyCode);
  const prefix = state.role === 'host' ? 'players.host' : 'players.guest';
  try {
    await updateDoc(ref, {
      [`${prefix}.distance`]: p.distance,
      [`${prefix}.score`]: p.score,
      [`${prefix}.alive`]: p.alive,
      [`${prefix}.lastSeen`]: Timestamp.now(),
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[mp] flushProgress failed', e);
  }
}

export async function markPlayerDied() {
  if (!state.lobbyCode || !state.role) return;
  // Pošli finální progress se alive=false, pak zkus uzavřít hru, pokud i druhý je mrtvý.
  if (state.pendingProgress) state.pendingProgress.alive = false;
  await flushProgress();
  await maybeFinishGame();
}

async function maybeFinishGame() {
  if (!state.lobbyCode || state.role !== 'host') return; // jen host uzavírá
  const lobby = state.lobby;
  if (!lobby || lobby.status !== 'playing') return;
  const host = lobby.players?.host;
  const guest = lobby.players?.guest;
  if (!host || !guest) return;
  if (host.alive || guest.alive) return;
  // Oba mrtví – vyhodnoť winner.
  let winnerId = null;
  if ((host.distance || 0) > (guest.distance || 0)) winnerId = host.id;
  else if ((guest.distance || 0) > (host.distance || 0)) winnerId = guest.id;
  else if ((host.score || 0) > (guest.score || 0)) winnerId = host.id;
  else if ((guest.score || 0) > (host.score || 0)) winnerId = guest.id;
  // jinak null = remíza
  try {
    await updateDoc(lobbyRef(state.lobbyCode), {
      status: 'finished',
      winnerId,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[mp] finish game failed', e);
  }
}

export async function requestRematch() {
  if (!state.lobbyCode || !state.role) return;
  const ref = lobbyRef(state.lobbyCode);
  const field = state.role === 'host' ? 'players.host.wantsRematch' : 'players.guest.wantsRematch';
  await updateDoc(ref, {
    [field]: true,
    updatedAt: serverTimestamp()
  });
  await maybeStartRematch();
}

async function maybeStartRematch() {
  if (state.role !== 'host') return;
  const lobby = state.lobby;
  if (!lobby || lobby.status !== 'finished') return;
  const host = lobby.players?.host;
  const guest = lobby.players?.guest;
  if (!host?.wantsRematch || !guest?.wantsRematch) return;
  try {
    await updateDoc(lobbyRef(state.lobbyCode), {
      status: 'waiting',
      gameSeed: makeGameSeed(),
      winnerId: null,
      'players.host.distance': 0,
      'players.host.score': 0,
      'players.host.alive': true,
      'players.host.wantsRematch': false,
      'players.host.ready': true,
      'players.guest.distance': 0,
      'players.guest.score': 0,
      'players.guest.alive': true,
      'players.guest.wantsRematch': false,
      'players.guest.ready': false,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('[mp] rematch failed', e);
  }
}

export async function backToLobby() {
  // Z výsledkové obrazovky zpět do lobby (nestartuje rematch, jen UI signál).
  // Stav lobby na Firestore zůstává `finished` dokud oba neodkliknou rematch
  // nebo někdo neopustí.
  emit('back-to-lobby', null);
}

export async function leaveLobby() {
  const code = state.lobbyCode;
  const role = state.role;
  if (!code || !role) {
    teardown();
    return;
  }
  const ref = lobbyRef(code);
  try {
    if (role === 'host') {
      // Host odejde → lobby zavřeme.
      await updateDoc(ref, {
        status: 'closed',
        'players.host.connected': false,
        updatedAt: serverTimestamp()
      });
      // Pokus o úklid (může selhat, pokud guest stále drží listener; to nevadí).
      try { await deleteDoc(ref); } catch (e) { /* nech to být */ }
    } else {
      await updateDoc(ref, {
        guestId: null,
        'players.guest': null,
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('[mp] leaveLobby failed', e);
  }
  teardown();
}

// ──────────────────────────────────────────────────────────────
// Internals
// ──────────────────────────────────────────────────────────────

function attachListener(code) {
  if (state.unsubscribe) {
    try { state.unsubscribe(); } catch (e) {}
    state.unsubscribe = null;
  }
  const ref = lobbyRef(code);
  state.unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      state.lobby = null;
      emit('lobby-removed', null);
      teardown();
      return;
    }
    state.lobby = { ...(snap.data() || {}), _annotations: annotateLobby(snap.data()) };
    emit('change', state.lobby);
    // Auto akce na změny stavu
    if (state.lobby.status === 'playing' && state.role) {
      emit('game-started', state.lobby);
    } else if (state.lobby.status === 'finished') {
      emit('game-finished', state.lobby);
      // Host se pokusí spustit rematch, pokud už mezitím oba klikli.
      maybeStartRematch();
    }
  }, (error) => {
    console.warn('[mp] onSnapshot error', error);
    emit('error', error);
  });
}

function annotateLobby(data) {
  if (!data) return {};
  const now = Date.now();
  const ann = { players: {} };
  for (const slot of ['host', 'guest']) {
    const p = data.players?.[slot];
    if (!p) { ann.players[slot] = null; continue; }
    const lastSeenMs = p.lastSeen?.toMillis ? p.lastSeen.toMillis() : 0;
    const stale = lastSeenMs > 0 && (now - lastSeenMs) > DISCONNECT_TIMEOUT_MS;
    ann.players[slot] = { staleConnection: stale, lastSeenAgeMs: lastSeenMs ? now - lastSeenMs : null };
  }
  return ann;
}

function startHeartbeat() {
  stopHeartbeat();
  state.heartbeatTimer = setInterval(async () => {
    if (!state.lobbyCode || !state.role) return;
    const ref = lobbyRef(state.lobbyCode);
    const field = state.role === 'host' ? 'players.host.lastSeen' : 'players.guest.lastSeen';
    try {
      await updateDoc(ref, {
        [field]: Timestamp.now()
      });
    } catch (e) {
      // Lobby pravděpodobně zmizela – necháme to být.
    }
    // Při heartbeatu zároveň protlač pending progress.
    if (state.pendingProgress) flushProgress();
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (state.heartbeatTimer) {
    clearInterval(state.heartbeatTimer);
    state.heartbeatTimer = null;
  }
}

function teardown() {
  stopHeartbeat();
  if (state.unsubscribe) {
    try { state.unsubscribe(); } catch (e) {}
    state.unsubscribe = null;
  }
  state.lobbyCode = null;
  state.role = null;
  state.lobby = null;
  state.pendingProgress = null;
  emit('left', null);
}

// TODO (Fáze 2+): napojit `gameSeed` na deterministický generátor překážek/yang/eventů,
// aby měli oba hráči stejnou sekvenci. Aktuální obstacles.js používá Math.random()
// přímo, takže by to vyžadovalo úpravu zdroje náhody – záměrně nezasahováno
// kvůli zachování singleplayer chování.

// Expozice pro non-modul části hry (panels.js, gameLoop.js).
if (typeof window !== 'undefined') {
  window.NWMultiplayer = {
    initMultiplayer,
    createLobby,
    joinLobby,
    setReady,
    startGame,
    leaveLobby,
    backToLobby,
    requestRematch,
    setLocalProgress,
    markPlayerDied,
    onChange,
    getState
  };
}
