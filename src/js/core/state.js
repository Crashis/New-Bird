// Game state
let gameState = 'idle'; // 'idle', 'playing', 'over'
let player = { x: 160, y: 390, vy: 0, r: 38, rotation: 0 };
let pipes = [];
let particles = [];
let score = 0;
let bestScore = 0;
let frameCount = 0;
let framesUntilNextPipe = 0;
let animationId = null;
let difficultyLevel = 0; // increases with score
let endlessMode = false; // set when player continues after winning
let invincibleUntil = 0;
let hasShield = false;
let shieldPhaseUntil = 0;
let nextVoiceLineScore = 0;
let activeVoiceLine = null;
let activeVoiceLineUntil = 0;
let pipesSinceYang = 0;
let yang = 0;
let wallets = 0;
let shieldStartOwned = false;
let invincibilityLevel = 0;
let walletAwardedThisRun = false;
let doubleYangLevel = 0;
let crownBonusLevel = 0;
let doubleYangUntil = 0;
let amazonNerfUntil = 0;
let amazonNerfSpeedMult = 1.0;
let pipesSincePowerup = 0;
let selectedSkinId = 'godias-zubaty';
let currentSkinIndex = 0;
let eventPhaseActive = false;
let unlockedAchievements = {};
let immortalityUses = 0;
let unlockToastTimer = null;
const EVENT_PHASE_TRIGGER_SCORE = 20;

const settings = {
  sfx: true,
  music: true,
  voiceLines: true,
  effects: true
};
const SETTINGS_KEYS = {
  sfx: 'nw_flappy_settings_sfx',
  music: 'nw_flappy_settings_music',
  voiceLines: 'nw_flappy_settings_voice_lines',
  effects: 'nw_flappy_settings_effects'
};

// Load best score from localStorage
try {
  const saved = localStorage.getItem('nw_flappy_best');
  if (saved) bestScore = parseInt(saved, 10) || 0;
} catch (e) {}

try {
  yang = parseInt(localStorage.getItem('nw_flappy_yang') || '0', 10) || 0;
  wallets = parseInt(localStorage.getItem('nw_flappy_wallets') || '0', 10) || 0;
  shieldStartOwned = localStorage.getItem('nw_flappy_upgrade_shield_start') === '1';
  invincibilityLevel = Math.min(3, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_invincibility') || '0', 10) || 0));
  doubleYangLevel = Math.min(2, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_double_yang') || '0', 10) || 0));
  crownBonusLevel = Math.min(2, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_crown_bonus') || '0', 10) || 0));
} catch (e) {}

unlockedAchievements = loadAchievements();
try {
  immortalityUses = Math.max(0, parseInt(localStorage.getItem(IMMORTALITY_USES_KEY) || '0', 10) || 0);
} catch (e) {}

try {
  const savedSkin = localStorage.getItem('nw_flappy_selected_skin');
  if (savedSkin) {
    const idx = SKINS.findIndex(s => s.id === savedSkin);
    if (idx !== -1 && SKINS[idx].unlocked) {
      selectedSkinId = savedSkin;
      currentSkinIndex = idx;
    }
  }
} catch (e) {}

try {
  for (const key of Object.keys(SETTINGS_KEYS)) {
    const stored = localStorage.getItem(SETTINGS_KEYS[key]);
    if (stored === '0') settings[key] = false;
    else if (stored === '1') settings[key] = true;
  }
} catch (e) {}

function saveSetting(key) {
  try { localStorage.setItem(SETTINGS_KEYS[key], settings[key] ? '1' : '0'); } catch (e) {}
}

function saveEconomy() {
  try {
    localStorage.setItem('nw_flappy_yang', String(yang));
    localStorage.setItem('nw_flappy_wallets', String(wallets));
    localStorage.setItem('nw_flappy_upgrade_shield_start', shieldStartOwned ? '1' : '0');
    localStorage.setItem('nw_flappy_upgrade_invincibility', String(invincibilityLevel));
    localStorage.setItem('nw_flappy_upgrade_double_yang', String(doubleYangLevel));
    localStorage.setItem('nw_flappy_upgrade_crown_bonus', String(crownBonusLevel));
  } catch (e) {}
}

function loadAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const state = {};
    for (const achievement of ACHIEVEMENTS) {
      const entry = parsed[achievement.id];
      if (entry === true) {
        state[achievement.id] = {
          unlocked: true,
          rewardClaimed: true,
          unlockedAt: Date.now()
        };
      } else if (entry && typeof entry === 'object' && entry.unlocked) {
        state[achievement.id] = {
          unlocked: true,
          rewardClaimed: entry.rewardClaimed !== false,
          unlockedAt: Number(entry.unlockedAt) || Date.now()
        };
      }
    }
    return state;
  } catch (e) {
    return {};
  }
}

function saveAchievements() {
  try { localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlockedAchievements)); } catch (e) {}
}

function saveAchievementCounters() {
  try { localStorage.setItem(IMMORTALITY_USES_KEY, String(immortalityUses)); } catch (e) {}
}
