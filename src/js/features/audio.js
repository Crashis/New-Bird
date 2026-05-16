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

const MUSIC_VOLUME = 0.16;
function getGameMusic() {
  return document.getElementById('gameMusic');
}
function startGameMusic() {
  if (!settings.music) return;
  const music = getGameMusic();
  if (!music) return;
  music.volume = MUSIC_VOLUME;
  try { music.playbackRate = 1.0; } catch (e) {}
  music.play().catch(() => {
    // Browser may block audio until the next user gesture, or the mp3 file may be missing.
  });
  // Event phase music tweaks take precedence (volume + playback rate).
  applyEventPhaseMusic();
}
function stopGameMusic() {
  const music = getGameMusic();
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  try {
    music.volume = MUSIC_VOLUME;
    music.playbackRate = 1.0;
  } catch (e) {}
}
function applyEventPhaseMusic() {
  const music = getGameMusic();
  if (!music) return;
  if (!settings.music) return;
  try {
    if (eventPhaseActive) {
      music.playbackRate = 1.08;
      music.volume = Math.min(1, MUSIC_VOLUME * 1.35);
    } else {
      music.playbackRate = 1.0;
      music.volume = MUSIC_VOLUME;
    }
  } catch (e) {}
}

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
