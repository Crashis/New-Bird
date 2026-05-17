// Dračí vejce — dlouhodobá progression minihra.
// Hráč koupí vejce (10Y), zahřívá ho přes runy a pak rozbije pro odměnu.
// Denní limit: max 3 koupě za den (reset o půlnoci lokálního času).

const DRAGON_EGG_PRICE = 10;
const DRAGON_EGG_DAILY_LIMIT = 3;
const DRAGON_EGG_DATE_KEY = 'dragonEggDailyDate';
const DRAGON_EGG_USES_KEY = 'dragonEggDailyUses';
const DRAGON_EGG_STATE_KEY = 'dragonEggState';

let dragonEggState = { active: false, startedRunCount: null, warmedRuns: 0 };
let dragonEggBusy = false;

function dragonEggLocalDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadDragonEggState() {
  try {
    const raw = localStorage.getItem(DRAGON_EGG_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        dragonEggState = {
          active: !!parsed.active,
          startedRunCount: (typeof parsed.startedRunCount === 'number') ? parsed.startedRunCount : null,
          warmedRuns: Math.max(0, parseInt(parsed.warmedRuns, 10) || 0)
        };
      }
    }
  } catch (e) {}
}

function saveDragonEggState() {
  try { localStorage.setItem(DRAGON_EGG_STATE_KEY, JSON.stringify(dragonEggState)); } catch (e) {}
}

function dragonEggDailyUsesToday() {
  try {
    const date = localStorage.getItem(DRAGON_EGG_DATE_KEY);
    if (date !== dragonEggLocalDate()) return 0;
    return Math.max(0, parseInt(localStorage.getItem(DRAGON_EGG_USES_KEY) || '0', 10) || 0);
  } catch (e) { return 0; }
}

function bumpDragonEggDailyUses() {
  try {
    const today = dragonEggLocalDate();
    const cur = dragonEggDailyUsesToday();
    localStorage.setItem(DRAGON_EGG_DATE_KEY, today);
    localStorage.setItem(DRAGON_EGG_USES_KEY, String(cur + 1));
  } catch (e) {}
}

function setDragonEggStatus(msg, type) {
  const el = document.getElementById('dragonEggStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'dragon-egg-status' + (type ? ' ' + type : '');
}

function renderDragonEggPanel() {
  const yangEl = document.getElementById('dragonEggYangs');
  const walletsEl = document.getElementById('dragonEggWallets');
  const dcEl = document.getElementById('dragonEggDragonCoins');
  if (yangEl) yangEl.textContent = yang;
  if (walletsEl) walletsEl.textContent = wallets;
  if (dcEl) dcEl.textContent = (typeof dragonCoins === 'number') ? dragonCoins : 0;

  const usesEl = document.getElementById('dragonEggDailyUsesLabel');
  if (usesEl) usesEl.textContent = `${dragonEggDailyUsesToday()} / ${DRAGON_EGG_DAILY_LIMIT}`;

  const statusEl = document.getElementById('dragonEggProgress');
  if (statusEl) {
    if (dragonEggState.active) {
      const w = Math.max(0, dragonEggState.warmedRuns | 0);
      statusEl.textContent = t('dragonEgg.warmedRuns', { w: w });
    } else {
      statusEl.textContent = t('dragonEgg.noEgg');
    }
  }

  const buyBtn = document.getElementById('dragonEggBuyBtn');
  const breakBtn = document.getElementById('dragonEggBreakBtn');
  const usedUp = dragonEggDailyUsesToday() >= DRAGON_EGG_DAILY_LIMIT;
  if (buyBtn) {
    buyBtn.disabled = dragonEggBusy || dragonEggState.active || usedUp || yang < DRAGON_EGG_PRICE;
    buyBtn.classList.toggle('disabled', buyBtn.disabled);
    buyBtn.textContent = t('dragonEgg.buyBtn', { price: DRAGON_EGG_PRICE });
  }
  if (breakBtn) breakBtn.textContent = t('dragonEgg.breakBtn');
  if (breakBtn) {
    breakBtn.disabled = dragonEggBusy || !dragonEggState.active;
    breakBtn.classList.toggle('disabled', breakBtn.disabled);
  }
}

function buyDragonEgg() {
  if (dragonEggBusy) return;
  if (dragonEggState.active) {
    setDragonEggStatus(t('dragonEgg.alreadyActive'), 'error');
    return;
  }
  if (dragonEggDailyUsesToday() >= DRAGON_EGG_DAILY_LIMIT) {
    setDragonEggStatus(t('dragonEgg.dailyLimit'), 'error');
    return;
  }
  if (yang < DRAGON_EGG_PRICE) {
    setDragonEggStatus(t('dragonEgg.notEnough', { price: DRAGON_EGG_PRICE }), 'error');
    return;
  }
  dragonEggBusy = true;
  yang -= DRAGON_EGG_PRICE;
  saveEconomy();
  dragonEggState = { active: true, startedRunCount: null, warmedRuns: 0 };
  saveDragonEggState();
  bumpDragonEggDailyUses();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  setDragonEggStatus(t('dragonEgg.bought'), 'win');
  dragonEggBusy = false;
  renderDragonEggPanel();
}

function breakDragonEgg() {
  if (dragonEggBusy) return;
  if (!dragonEggState.active) {
    setDragonEggStatus(t('dragonEgg.noActive'), 'error');
    return;
  }
  dragonEggBusy = true;
  const w = Math.max(0, dragonEggState.warmedRuns | 0);
  let msg = '';
  let kind = 'info';

  if (w < 3) {
    if (Math.random() < 0.5) {
      yang += 10;
      msg = t('dragonEgg.weakCrack');
      kind = 'win';
    } else {
      msg = t('dragonEgg.empty');
      kind = 'info';
    }
  } else if (w < 7) {
    if (Math.random() < 0.6) {
      yang += 20;
      msg = t('dragonEgg.solidCrack');
      kind = 'win';
    } else {
      msg = t('dragonEgg.hollow');
      kind = 'info';
    }
  } else {
    const reward = 30 + Math.floor(Math.random() * 21); // 30–50
    yang += reward;
    const extras = [];
    if (Math.random() < 0.20) { wallets += 1; extras.push(t('dragonEgg.extraWallet')); }
    if (Math.random() < 0.05) { dragonCoins += 1; saveDragonCoins(); extras.push(t('dragonEgg.extraDragonCoin')); }
    msg = t('dragonEgg.hatched', { reward: reward, extras: extras.length ? ' · ' + extras.join(' · ') : '' });
    kind = 'win';
  }

  saveEconomy();
  dragonEggState = { active: false, startedRunCount: null, warmedRuns: 0 };
  saveDragonEggState();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  setDragonEggStatus(msg, kind);
  dragonEggBusy = false;
  renderDragonEggPanel();
}

// Volá se z gameLoop endGame/winGame po reálném runu.
function notifyRunEnded() {
  if (dragonEggState && dragonEggState.active) {
    dragonEggState.warmedRuns = Math.max(0, (dragonEggState.warmedRuns | 0) + 1);
    saveDragonEggState();
  }
}

function initDragonEgg() {
  loadDragonEggState();
  setDragonEggStatus('', 'info');
  renderDragonEggPanel();
}

// Načti stav už při startu skriptu, aby notifyRunEnded fungoval i bez otevření panelu.
loadDragonEggState();
