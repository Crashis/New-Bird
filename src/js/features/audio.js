// ===== HRA: BOJ PROTI AMAZONU (Flappy Bird style) =====

// ===== ZVUK: "HMM" přes WebAudio =====
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
  }
  // Resume if suspended (browsers require user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ===== HUDBA: 5 stop podle obrazovky / fáze =====
// intro = countdown / default screen
// menu  = hlavní herní menu (overlay aktivní, gameState != 'playing')
// phase1 = běžící run, score < 20
// phase2 = po aktivaci event fáze (score 20+), platí i pro frost fázi (score 60)
// phase3 = po aktivaci void fáze (score 100+ po Bezos modal)
const MUSIC_TRACKS = {
  intro:  './assets/audio/intro.mp3',
  menu:   './assets/audio/game-menu.mp3',
  phase1: './assets/audio/phase1.mp3',
  phase2: './assets/audio/phase2.mp3',
  phase3: './assets/audio/phase3.mp3'
};
const MUSIC_VOLUMES = {
  intro:  0.28,
  menu:   0.32,
  phase1: 0.35,
  phase2: 0.38,
  phase3: 0.40
};
// Kept for compatibility with existing references.
const MUSIC_VOLUME = MUSIC_VOLUMES.phase1;

const musicPlayers = {};
let currentMusicKey = null;
let audioUnlocked = false;

function getMusicMaster() {
  const v = (typeof settings !== 'undefined' && Number.isFinite(settings.musicVolume))
    ? settings.musicVolume : 0.35;
  return Math.max(0, Math.min(1, v));
}

function getTrackVolume(key) {
  const base = MUSIC_VOLUMES[key] || 0.3;
  // Master slider scales the per-track base so phase3 stays a bit louder than phase1.
  // Slider default 0.35 = unchanged base volumes.
  const scaled = base * (getMusicMaster() / 0.35);
  return Math.max(0, Math.min(1, scaled));
}

function applyMusicVolume() {
  for (const k of Object.keys(musicPlayers)) {
    try { musicPlayers[k].volume = getTrackVolume(k); } catch (e) {}
  }
}

function setMusicVolume(value) {
  let v = Number(value);
  if (!Number.isFinite(v)) v = 0.35;
  v = Math.max(0, Math.min(1, v));
  settings.musicVolume = v;
  if (typeof saveMusicVolume === 'function') saveMusicVolume();
  applyMusicVolume();
}

function getMusicVolume() {
  return getMusicMaster();
}

function getMusicPlayer(key) {
  if (musicPlayers[key]) return musicPlayers[key];
  const src = MUSIC_TRACKS[key];
  if (!src) return null;
  try {
    const a = new Audio(src);
    a.loop = true;
    a.preload = 'auto';
    a.volume = getTrackVolume(key);
    // Prevent uncaught error spam if a file is missing or codec unsupported.
    a.addEventListener('error', () => {}, { once: false });
    musicPlayers[key] = a;
    return a;
  } catch (e) { return null; }
}

function deriveCurrentMusicKey() {
  const overlay = document.getElementById('gameOverlay');
  const inOverlay = overlay && overlay.classList.contains('active');
  if (!inOverlay) return 'intro';
  if (typeof gameState === 'undefined' || gameState !== 'playing') return 'menu';
  if (typeof currentGamePhase !== 'undefined' && currentGamePhase === GAME_PHASES.VOID) return 'phase3';
  if ((typeof eventPhaseActive !== 'undefined' && eventPhaseActive) ||
      (typeof currentGamePhase !== 'undefined' && currentGamePhase === GAME_PHASES.FROST)) {
    return 'phase2';
  }
  return 'phase1';
}

function playMusic(key) {
  if (!settings.music) {
    // Remember the intent so toggling music back on restores the right track.
    currentMusicKey = key;
    return;
  }
  // Same track already running — no-op (avoid restart spam per frame).
  if (currentMusicKey === key) {
    const cur = musicPlayers[key];
    if (cur && !cur.paused) return;
  }
  // Stop everything else first to guarantee one track at a time.
  for (const k of Object.keys(musicPlayers)) {
    if (k !== key) {
      try {
        musicPlayers[k].pause();
        musicPlayers[k].currentTime = 0;
      } catch (e) {}
    }
  }
  currentMusicKey = key;
  const audio = getMusicPlayer(key);
  if (!audio) return;
  try { audio.volume = getTrackVolume(key); } catch (e) {}
  try { audio.playbackRate = 1.0; } catch (e) {}
  // play() returns a promise that rejects on autoplay block — swallow silently.
  const p = audio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

function stopMusic() {
  for (const k of Object.keys(musicPlayers)) {
    try {
      musicPlayers[k].pause();
      musicPlayers[k].currentTime = 0;
    } catch (e) {}
  }
  currentMusicKey = null;
}

function playIntroMusic() { playMusic('intro'); }
function playMenuMusic()  { playMusic('menu'); }
function playPhase2Music() { playMusic('phase2'); }
function playPhase3Music() { playMusic('phase3'); }

// Compatibility wrappers — existing callsites in gameLoop/eventPhase keep working.
function startGameMusic() {
  // Derive the right track for the current screen / phase and play it.
  playMusic(deriveCurrentMusicKey());
}
function stopGameMusic() { stopMusic(); }
function applyEventPhaseMusic() {
  // Phase changes (event/frost/void) call this — re-derive and switch.
  if (!settings.music) return;
  playMusic(deriveCurrentMusicKey());
}

// Re-evaluate the appropriate track for the current UI state and play it.
function updateMusicForState() {
  if (!settings.music) { stopMusic(); return; }
  playMusic(deriveCurrentMusicKey());
}

// Browsers block autoplay until the first user gesture. After the first
// interaction we kick off the track that matches the current screen.
function unlockAudioAfterFirstInteraction() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Resume WebAudio context too — silent no-op if it doesn't exist yet.
  if (audioCtx && audioCtx.state === 'suspended') {
    try { audioCtx.resume().catch(() => {}); } catch (e) {}
  }
  if (settings.music) playMusic(currentMusicKey || deriveCurrentMusicKey());
}

(function initMusicUnlockListeners() {
  const handler = () => { unlockAudioAfterFirstInteraction(); };
  const opts = { once: true, passive: true };
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', handler, opts);
    window.addEventListener('keydown', handler, opts);
    window.addEventListener('touchstart', handler, opts);
    window.addEventListener('click', handler, opts);
  }
})();

// Try to play intro as soon as the DOM is ready. Browsers may block until
// the first interaction — unlockAudioAfterFirstInteraction() handles that.
(function tryAutoplayIntro() {
  const start = () => {
    if (settings && settings.music && currentMusicKey === null) {
      playMusic('intro');
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

function playHmm() {
  if (!settings.sfx) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const duration = 1.25;

  // Delší, povýšené "Hmmmmmmm" — pomalý náběh, držení tónu a arogantní skluz dolů.
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(118, now);
  osc1.frequency.linearRampToValueAtTime(132, now + 0.18);
  osc1.frequency.setValueAtTime(132, now + 0.65);
  osc1.frequency.exponentialRampToValueAtTime(92, now + duration);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(236, now);
  osc2.frequency.linearRampToValueAtTime(264, now + 0.18);
  osc2.frequency.setValueAtTime(264, now + 0.65);
  osc2.frequency.exponentialRampToValueAtTime(184, now + duration);

  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(5.5, now);

  const vibratoGain1 = ctx.createGain();
  vibratoGain1.gain.setValueAtTime(0, now);
  vibratoGain1.gain.linearRampToValueAtTime(3.5, now + 0.25);
  vibratoGain1.gain.linearRampToValueAtTime(1.5, now + duration);

  const vibratoGain2 = ctx.createGain();
  vibratoGain2.gain.setValueAtTime(0, now);
  vibratoGain2.gain.linearRampToValueAtTime(6, now + 0.25);
  vibratoGain2.gain.linearRampToValueAtTime(2.5, now + duration);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(420, now);
  lowpass.frequency.linearRampToValueAtTime(330, now + duration);
  lowpass.Q.value = 7;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(260, now);
  bandpass.frequency.linearRampToValueAtTime(230, now + duration);
  bandpass.Q.value = 10;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.10);
  gain.gain.setValueAtTime(0.28, now + 0.82);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  vibrato.connect(vibratoGain1);
  vibrato.connect(vibratoGain2);
  vibratoGain1.connect(osc1.frequency);
  vibratoGain2.connect(osc2.frequency);

  osc1.connect(bandpass);
  osc2.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gain);
  gain.connect(ctx.destination);

  vibrato.start(now);
  osc1.start(now);
  osc2.start(now);
  vibrato.stop(now + duration);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}
