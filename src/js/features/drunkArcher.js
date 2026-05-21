// Opilý lukostřelec — skill timing minihra za Err kostky.

const DRUNK_ARCHER_ENTRY_COST = 1;
const DRUNK_ARCHER_TARGET_MIN = 20;
const DRUNK_ARCHER_TARGET_MAX = 80;
const DRUNK_ARCHER_PERFECT_RADIUS = 3;
const DRUNK_ARCHER_GOOD_RADIUS = 8;
const DRUNK_ARCHER_SPEED = 0.095; // percent per millisecond

let drunkArcherState = 'idle'; // 'idle' | 'aiming' | 'result'
let drunkArcherTargetCenter = 50;
let drunkArcherMarkerPos = 0;
let drunkArcherStartedAt = 0;
let drunkArcherAnimId = null;
let drunkArcherShotResolved = false;

function setDrunkArcherStatus(msg, type) {
  const el = document.getElementById('drunkArcherStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'drunk-archer-status' + (type ? ' ' + type : '');
}

function randomIntInclusive(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function resetDrunkArcherEffects() {
  const range = document.getElementById('drunkArcherRange');
  if (!range) return;
  range.classList.remove('perfect');
  range.classList.remove('miss');
}

function renderDrunkArcherPanel() {
  const errEl = document.getElementById('drunkArcherErrCubes');
  const yangEl = document.getElementById('drunkArcherYangs');
  const walletsEl = document.getElementById('drunkArcherWallets');
  const dcEl = document.getElementById('drunkArcherDragonCoins');
  if (errEl) errEl.textContent = String((typeof errCubes === 'number') ? errCubes : 0);
  if (yangEl) yangEl.textContent = yang;
  if (walletsEl) walletsEl.textContent = wallets;
  if (dcEl) dcEl.textContent = typeof dragonCoins === 'number' ? dragonCoins : 0;

  const target = document.getElementById('drunkArcherTarget');
  const good = document.getElementById('drunkArcherGoodZone');
  const perfect = document.getElementById('drunkArcherPerfectZone');
  const marker = document.getElementById('drunkArcherMarker');
  const goodLeft = Math.max(0, drunkArcherTargetCenter - DRUNK_ARCHER_GOOD_RADIUS);
  const perfectLeft = Math.max(0, drunkArcherTargetCenter - DRUNK_ARCHER_PERFECT_RADIUS);
  if (target) target.style.left = `${drunkArcherTargetCenter}%`;
  if (good) {
    good.style.left = `${goodLeft}%`;
    good.style.width = `${DRUNK_ARCHER_GOOD_RADIUS * 2}%`;
  }
  if (perfect) {
    perfect.style.left = `${perfectLeft}%`;
    perfect.style.width = `${DRUNK_ARCHER_PERFECT_RADIUS * 2}%`;
  }
  if (marker) marker.style.left = `${drunkArcherMarkerPos}%`;

  const startBtn = document.getElementById('drunkArcherStartBtn');
  const shootBtn = document.getElementById('drunkArcherShootBtn');
  if (startBtn) {
    startBtn.disabled = drunkArcherState === 'aiming';
    startBtn.classList.toggle('disabled', startBtn.disabled);
  }
  if (shootBtn) {
    shootBtn.disabled = drunkArcherState !== 'aiming';
    shootBtn.classList.toggle('disabled', shootBtn.disabled);
  }
}

function setNewDrunkArcherTarget() {
  drunkArcherTargetCenter = DRUNK_ARCHER_TARGET_MIN +
    Math.random() * (DRUNK_ARCHER_TARGET_MAX - DRUNK_ARCHER_TARGET_MIN);
}

function updateDrunkArcherMarker() {
  const elapsed = Math.max(0, performance.now() - drunkArcherStartedAt);
  const raw = (elapsed * DRUNK_ARCHER_SPEED) % 200;
  drunkArcherMarkerPos = raw <= 100 ? raw : 200 - raw;
}

function animateDrunkArcher() {
  if (drunkArcherState !== 'aiming') return;
  updateDrunkArcherMarker();
  renderDrunkArcherPanel();
  drunkArcherAnimId = requestAnimationFrame(animateDrunkArcher);
}

function stopDrunkArcherAnimation() {
  if (drunkArcherAnimId) {
    cancelAnimationFrame(drunkArcherAnimId);
    drunkArcherAnimId = null;
  }
}

function startDrunkArcherAttempt() {
  if (drunkArcherState === 'aiming') return;
  if (errCubes < DRUNK_ARCHER_ENTRY_COST) {
    setDrunkArcherStatus(t('drunkArcher.noErrCubes'), 'error');
    renderDrunkArcherPanel();
    return;
  }

  errCubes -= DRUNK_ARCHER_ENTRY_COST;
  saveEconomy();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();

  resetDrunkArcherEffects();
  setNewDrunkArcherTarget();
  drunkArcherMarkerPos = 0;
  drunkArcherStartedAt = performance.now();
  drunkArcherShotResolved = false;
  drunkArcherState = 'aiming';
  setDrunkArcherStatus(t('drunkArcher.aiming'), 'info');
  renderDrunkArcherPanel();
  stopDrunkArcherAnimation();
  drunkArcherAnimId = requestAnimationFrame(animateDrunkArcher);
}

function buildDrunkArcherRewardText(prefix, yangReward, walletBonus, dragonCoinBonus) {
  let msg = t('drunkArcher.gainedYang', { prefix: prefix, amount: yangReward });
  if (walletBonus) msg += t('drunkArcher.bonusWallet');
  if (dragonCoinBonus) msg += t('drunkArcher.bonusDragonCoin');
  return msg;
}

function applyDrunkArcherReward(kind) {
  let yangReward = 0;
  let walletBonus = false;
  let dragonCoinBonus = false;
  let msg = '';

  if (kind === 'perfect') {
    yangReward = Math.round(randomIntInclusive(40, 50) * 0.6 * 1.25);
    walletBonus = Math.random() < 0.20;
    dragonCoinBonus = Math.random() < 0.10;
    msg = buildDrunkArcherRewardText(t('drunkArcher.perfect'), yangReward, walletBonus, dragonCoinBonus);
  } else if (kind === 'good') {
    yangReward = Math.round(randomIntInclusive(20, 35) * 0.6 * 1.25);
    walletBonus = Math.random() < 0.08;
    dragonCoinBonus = Math.random() < 0.02;
    msg = buildDrunkArcherRewardText(t('drunkArcher.nice'), yangReward, walletBonus, dragonCoinBonus);
  } else {
    msg = t('drunkArcher.missed');
  }

  if (yangReward > 0) yang += yangReward;
  if (walletBonus) wallets += 1;
  if (dragonCoinBonus) dragonCoins += 1;
  saveEconomy();
  if (dragonCoinBonus) saveDragonCoins();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  return msg;
}

function shootDrunkArcher() {
  if (drunkArcherState !== 'aiming' || drunkArcherShotResolved) return;
  drunkArcherShotResolved = true;
  stopDrunkArcherAnimation();

  const distance = Math.abs(drunkArcherMarkerPos - drunkArcherTargetCenter);
  let kind = 'miss';
  if (distance <= DRUNK_ARCHER_PERFECT_RADIUS) kind = 'perfect';
  else if (distance <= DRUNK_ARCHER_GOOD_RADIUS) kind = 'good';

  drunkArcherState = 'result';
  const msg = applyDrunkArcherReward(kind);
  setDrunkArcherStatus(msg, kind === 'miss' ? 'lose' : 'win');

  const range = document.getElementById('drunkArcherRange');
  if (range) {
    range.classList.remove('perfect');
    range.classList.remove('miss');
    void range.offsetWidth;
    range.classList.add(kind === 'miss' ? 'miss' : 'perfect');
  }
  renderDrunkArcherPanel();
}

function initDrunkArcher() {
  stopDrunkArcherAnimation();
  drunkArcherState = 'idle';
  drunkArcherMarkerPos = 0;
  drunkArcherShotResolved = false;
  setNewDrunkArcherTarget();
  resetDrunkArcherEffects();
  setDrunkArcherStatus(t('drunkArcher.statusInit'), 'info');
  renderDrunkArcherPanel();
}
