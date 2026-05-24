// Game state
let gameState = 'idle'; // 'idle', 'playing', 'over'
let currentGameMode = 'normal'; // 'normal' | 'bezosBoss'
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
let shieldCount = 0; // 0, 1 or 2 — hasShield === (shieldCount > 0)
let shieldPhaseUntil = 0;
let nextVoiceLineScore = 0;
let activeVoiceLine = null;
let activeVoiceLineUntil = 0;
let pipesSinceYang = 0;
let yang = 0;
let runYangs = 0; // yangs earned in the current run (reset on startGame)
let wallets = 0;
let dragonCoins = 0;
let errCubes = 0;
let dragonCoinAwardedThisRun = false;
let shieldStartOwned = false;
let invincibilityLevel = 0;
let walletAwardedThisRun = false;
let doubleYangLevel = 0;
let crownBonusLevel = 0;
let maxShields2Owned = false;
let shieldRegenLevel = 0;
// Cooldown štítu se počítá v ms reálného času. Tikne jen v update() (aktivní
// gameplay), takže pauza / dialog cooldown přirozeně zastaví. Nezávisí na FPS
// monitoru ani na zrychlování hry — pouze na uplynulém čase mezi tiky.
let shieldRegenElapsedMs = 0;
let shieldRegenLastTickMs = 0;
let doubleYangUntil = 0;
let amazonNerfUntil = 0;
let amazonNerfSpeedMult = 1.0;
let pipesSincePowerup = 0;
// Počítadlo spawnů error kostek před skóre 100 v aktuálním normálním runu.
// Resetuje se v startGameNow(). Limit (2) se neuplatňuje od score >= 100.
let errCubesSpawnedBefore100 = 0;
let selectedSkinId = 'godias-zubaty';
let currentSkinIndex = 0;
let eventPhaseActive = false;
let unlockedAchievements = {};
let immortalityUses = 0;
let unlockToastTimer = null;
const EVENT_PHASE_TRIGGER_SCORE = 20;

// ===== Multi-phase / milestone state =====
const GAME_PHASES = {
  NORMAL: 'normal',
  CORRUPTED: 'corrupted', // score 20
  FROST: 'frost',         // score 60
  VOID: 'void',           // score 100
  GREEN: 'green',         // score 200
  DESERT: 'desert'        // score 300
};
const FROST_PHASE_TRIGGER_SCORE = 60;
const BEZOS_MILESTONE_SCORE = 100;
const GREEN_PHASE_TRIGGER_SCORE = 200;
const DESERT_PHASE_TRIGGER_SCORE = 300;
const FINAL_MILESTONE_SCORE = 500;

let currentGamePhase = GAME_PHASES.NORMAL;
let score60PhaseActivated = false;
let score100MilestoneShown = false;
let score200MilestoneShown = false;
let score300MilestoneShown = false;
let score500FinalShown = false;

// Měny získané v právě probíhajícím runu (resetuje se v startGameNow).
let currentRunRewards = { yang: 0, wallets: 0, dragonCoins: 0, errCubes: 0 };
function resetCurrentRunRewards() {
  currentRunRewards = { yang: 0, wallets: 0, dragonCoins: 0, errCubes: 0 };
}
function trackRunReward(type, amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return;
  if (typeof gameState !== 'undefined' && gameState !== 'playing') return;
  if (currentRunRewards[type] === undefined) return;
  currentRunRewards[type] += n;
}

const settings = {
  sfx: true,
  music: true,
  voiceLines: true,
  effects: true,
  // Default: ON for mobile / coarse-pointer devices, OFF on desktop.
  // Overridden below if the user has previously set the toggle explicitly.
  mobileBoost: !!(window.PERF_MOBILE_AUTO),
  musicVolume: 0.35
};
const SETTINGS_KEYS = {
  sfx: 'nw_flappy_settings_sfx',
  music: 'nw_flappy_settings_music',
  voiceLines: 'nw_flappy_settings_voice_lines',
  effects: 'nw_flappy_settings_effects',
  mobileBoost: 'nw_flappy_settings_mobile_boost'
};
const MUSIC_VOLUME_KEY = 'nw_flappy_settings_music_volume';
const DRAGON_COINS_KEY = 'nw_flappy_dragon_coins';
const ERR_CUBES_KEY = 'nw_flappy_err_cubes';
const HEIRLOOM_ROCKET_PURCHASED_KEY = 'heirloomRocketPurchased';
const BEZOS_BOSS_TICKET_KEY = 'bezosBossTicketUnlocked';
const BEZOS_BOSS_LAST_WIN_KEY = 'bezosBossLastWinDate';
const BEZOS_BOSS_BONUS_USED_DATE_KEY = 'bezosBossBonusUsedDate';
const MOON_TICKETS_KEY = 'nw_flappy_moon_tickets';
const LYZAR_BOSS_TICKET_KEY = 'lyzarBossTicketUnlocked';
const LYZAR_BOSS_LAST_WIN_KEY = 'lyzarBossLastWinDate';

let bezosBossTicketUnlocked = false;
try {
  bezosBossTicketUnlocked = localStorage.getItem(BEZOS_BOSS_TICKET_KEY) === '1';
} catch (e) {}

let lyzarBossTicketUnlocked = false;
try {
  lyzarBossTicketUnlocked = localStorage.getItem(LYZAR_BOSS_TICKET_KEY) === '1';
} catch (e) {}

function isLyzarBossTicketUnlocked() { return lyzarBossTicketUnlocked === true; }
function unlockLyzarBossTicket() {
  if (lyzarBossTicketUnlocked) return;
  lyzarBossTicketUnlocked = true;
  try { localStorage.setItem(LYZAR_BOSS_TICKET_KEY, '1'); } catch (e) {}
}
function getLyzarBossLastWinDate() {
  try { return localStorage.getItem(LYZAR_BOSS_LAST_WIN_KEY) || ''; } catch (e) { return ''; }
}
// Lyžař boss je zatím ve vývoji — denní reset připravený pro budoucí gameplay.
function wasLyzarBossWonToday() {
  return getLyzarBossLastWinDate() === getTodayLocalDateString();
}

let moonTickets = 0;
try {
  moonTickets = Math.max(0, parseInt(localStorage.getItem(MOON_TICKETS_KEY) || '0', 10) || 0);
} catch (e) {}

function getMoonTickets() { return moonTickets; }

function saveMoonTickets() {
  try { localStorage.setItem(MOON_TICKETS_KEY, String(moonTickets)); } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('moonTickets'); } catch (e) {}
}

function addMoonTickets(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return;
  moonTickets += n;
  saveMoonTickets();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function spendMoonTicket() {
  if (moonTickets <= 0) return false;
  moonTickets -= 1;
  saveMoonTickets();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  return true;
}

function isBezosBossTicketUnlocked() { return bezosBossTicketUnlocked === true; }

function unlockBezosBossTicket() {
  if (bezosBossTicketUnlocked) return;
  bezosBossTicketUnlocked = true;
  try { localStorage.setItem(BEZOS_BOSS_TICKET_KEY, '1'); } catch (e) {}
}

function getTodayLocalDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getBezosBossLastWinDate() {
  try { return localStorage.getItem(BEZOS_BOSS_LAST_WIN_KEY) || ''; } catch (e) { return ''; }
}

function getBezosBossBonusUsedDate() {
  try { return localStorage.getItem(BEZOS_BOSS_BONUS_USED_DATE_KEY) || ''; } catch (e) { return ''; }
}

function hasNeschopenkaBonusAvailableToday() {
  if (!isBezosBossTicketUnlocked()) return false;
  if (typeof isHeirloomNeschopenkaPurchased !== 'function' || !isHeirloomNeschopenkaPurchased()) return false;
  return getBezosBossBonusUsedDate() !== getTodayLocalDateString();
}

function setBezosBossLastWinToday() {
  const today = getTodayLocalDateString();
  if (getBezosBossLastWinDate() !== today) {
    try { localStorage.setItem(BEZOS_BOSS_LAST_WIN_KEY, today); } catch (e) {}
    return;
  }
  try { localStorage.setItem(BEZOS_BOSS_BONUS_USED_DATE_KEY, today); } catch (e) {}
}

function wasBezosBossWonToday() {
  if (getBezosBossLastWinDate() !== getTodayLocalDateString()) return false;
  if (hasNeschopenkaBonusAvailableToday()) return false;
  return true;
}

// Load best score from localStorage
try {
  const saved = localStorage.getItem('nw_flappy_best');
  if (saved) bestScore = parseInt(saved, 10) || 0;
} catch (e) {}

try {
  yang = parseInt(localStorage.getItem('nw_flappy_yang') || '0', 10) || 0;
  wallets = parseInt(localStorage.getItem('nw_flappy_wallets') || '0', 10) || 0;
  dragonCoins = Math.max(0, parseInt(localStorage.getItem(DRAGON_COINS_KEY) || '0', 10) || 0);
  errCubes = Math.max(0, parseInt(localStorage.getItem(ERR_CUBES_KEY) || '0', 10) || 0);
  shieldStartOwned = localStorage.getItem('nw_flappy_upgrade_shield_start') === '1';
  invincibilityLevel = Math.min(INVINCIBILITY_MAX_LEVEL, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_invincibility') || '0', 10) || 0));
  doubleYangLevel = Math.min(DOUBLE_YANG_MAX_LEVEL, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_double_yang') || '0', 10) || 0));
  crownBonusLevel = Math.min(CROWN_BONUS_MAX_LEVEL, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_crown_bonus') || '0', 10) || 0));
  maxShields2Owned = localStorage.getItem('nw_flappy_upgrade_max_shields_2') === '1';
  shieldRegenLevel = Math.min(SHIELD_REGEN_MAX_LEVEL, Math.max(0, parseInt(localStorage.getItem('nw_flappy_upgrade_shield_regen') || '0', 10) || 0));
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

let selectedTrailId = null;
let selectedTrailColor = TRAIL_DEFAULT_COLOR;
let selectedSpecialIds = [];

try {
  const t = localStorage.getItem('nw_flappy_selected_trail');
  if (t) {
    const trail = TRAILS.find(x => x.id === t);
    if (trail && trail.unlocked) selectedTrailId = t;
  }
  const tc = localStorage.getItem('nw_flappy_selected_trail_color');
  if (tc && /^#[0-9a-fA-F]{6}$/.test(tc)) selectedTrailColor = tc;
  const raw = localStorage.getItem('nw_flappy_selected_specials');
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      selectedSpecialIds = parsed.filter(id => {
        const s = SPECIALS.find(x => x.id === id);
        return s && s.unlocked;
      });
    }
  }
} catch (e) {}

function saveSelectedTrail() {
  try {
    if (selectedTrailId) localStorage.setItem('nw_flappy_selected_trail', selectedTrailId);
    else localStorage.removeItem('nw_flappy_selected_trail');
    localStorage.setItem('nw_flappy_selected_trail_color', selectedTrailColor);
  } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('trail-select'); } catch (e) {}
}

function saveSelectedSpecials() {
  try { localStorage.setItem('nw_flappy_selected_specials', JSON.stringify(selectedSpecialIds)); } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('specials-select'); } catch (e) {}
}

try {
  for (const key of Object.keys(SETTINGS_KEYS)) {
    const stored = localStorage.getItem(SETTINGS_KEYS[key]);
    if (stored === '0') settings[key] = false;
    else if (stored === '1') settings[key] = true;
  }
} catch (e) {}

try {
  const storedVol = localStorage.getItem(MUSIC_VOLUME_KEY);
  if (storedVol !== null) {
    const v = parseFloat(storedVol);
    if (Number.isFinite(v) && v >= 0 && v <= 1) settings.musicVolume = v;
  }
} catch (e) {}

function saveMusicVolume() {
  try { localStorage.setItem(MUSIC_VOLUME_KEY, String(settings.musicVolume)); } catch (e) {}
}

function saveDragonCoins() {
  try { localStorage.setItem(DRAGON_COINS_KEY, String(dragonCoins)); } catch (e) {}
}

function getDragonCoins() { return dragonCoins; }

function saveErrCubes() {
  try { localStorage.setItem(ERR_CUBES_KEY, String(errCubes)); } catch (e) {}
}

function getErrCubes() { return errCubes; }

function addErrCubes(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return;
  errCubes += n;
  trackRunReward('errCubes', n);
  saveErrCubes();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function addDragonCoins(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (!n) return;
  dragonCoins += n;
  trackRunReward('dragonCoins', n);
  saveDragonCoins();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function spendDragonCoins(amount) {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0 || dragonCoins < n) return false;
  dragonCoins -= n;
  saveDragonCoins();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  return true;
}

// Sync Mobile Boost into the perf flag + body class for CSS-driven effect trimming.
window.MOBILE_BOOST = settings.mobileBoost === true;
if (typeof window.NWUtils?.refreshPerfMobile === 'function') {
  window.NWUtils.refreshPerfMobile();
}
if (typeof document !== 'undefined' && document.body) {
  document.body.classList.toggle('mobile-boost', window.MOBILE_BOOST);
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.toggle('mobile-boost', window.MOBILE_BOOST);
  });
}

function saveSetting(key) {
  try { localStorage.setItem(SETTINGS_KEYS[key], settings[key] ? '1' : '0'); } catch (e) {}
}

function saveEconomy() {
  try {
    localStorage.setItem('nw_flappy_yang', String(yang));
    localStorage.setItem('nw_flappy_wallets', String(wallets));
    localStorage.setItem(ERR_CUBES_KEY, String(errCubes));
    localStorage.setItem('nw_flappy_upgrade_shield_start', shieldStartOwned ? '1' : '0');
    localStorage.setItem('nw_flappy_upgrade_invincibility', String(invincibilityLevel));
    localStorage.setItem('nw_flappy_upgrade_double_yang', String(doubleYangLevel));
    localStorage.setItem('nw_flappy_upgrade_crown_bonus', String(crownBonusLevel));
    localStorage.setItem('nw_flappy_upgrade_max_shields_2', maxShields2Owned ? '1' : '0');
    localStorage.setItem('nw_flappy_upgrade_shield_regen', String(shieldRegenLevel));
  } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('economy'); } catch (e) {}
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
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('achievement'); } catch (e) {}
}

function saveAchievementCounters() {
  try { localStorage.setItem(IMMORTALITY_USES_KEY, String(immortalityUses)); } catch (e) {}
  try { if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') window.NWCloudSave.queueCloudSave('achievement-counter'); } catch (e) {}
}
