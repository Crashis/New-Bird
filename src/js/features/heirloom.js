// Heirloom — universal equippable items, shared by every skin. Max 2 equipped at once.
// Rocket launcher: right-click fires; 1 ammo per run; refills once at score 100.
// Lektvar Aeternum: on death, chance to revive (50% → 40 → 30 → 20 → 10%, min 10%).
// Godiasova peněženka: all earned in-game currencies ×3.

const HEIRLOOM_ROCKET_EQUIPPED_KEY = 'heirloomRocketEquipped';
const HEIRLOOM_ROCKET_KEY = HEIRLOOM_ROCKET_EQUIPPED_KEY;
const HEIRLOOM_ROCKET_COST_YANGS = 1000;
const HEIRLOOM_ROCKET_COST_DRAGON_COINS = 10;

const HEIRLOOM_POTION_PURCHASED_KEY = 'heirloomPotionPurchased';
const HEIRLOOM_POTION_EQUIPPED_KEY = 'heirloomPotionEquipped';
const HEIRLOOM_POTION_COST_YANGS = 5000;
const HEIRLOOM_POTION_COST_WALLETS = 50;
const HEIRLOOM_POTION_COST_DRAGON_COINS = 25;

const HEIRLOOM_GODIAS_PURCHASED_KEY = 'heirloomGodiasPurchased';
const HEIRLOOM_GODIAS_EQUIPPED_KEY = 'heirloomGodiasEquipped';
const HEIRLOOM_GODIAS_COST_YANGS = 10000;
const HEIRLOOM_GODIAS_COST_WALLETS = 100;
const HEIRLOOM_GODIAS_COST_DRAGON_COINS = 100;

const MAX_EQUIPPED_HEIRLOOMS = 2;

let heirloomRocketPurchased = false;
let heirloomRocketEquipped = false;

let heirloomPotionPurchased = false;
let heirloomPotionEquipped = false;
let potionReviveChance = 0.50;

let heirloomGodiasPurchased = false;
let heirloomGodiasEquipped = false;

function loadBool(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    if (stored === '1' || stored === 'true') return true;
    if (stored === '0' || stored === 'false') return false;
  } catch (e) {}
  return fallback;
}

function loadHeirloomState() {
  heirloomRocketPurchased = loadBool(HEIRLOOM_ROCKET_PURCHASED_KEY, false);
  heirloomRocketEquipped = loadBool(HEIRLOOM_ROCKET_KEY, false);
  if (!heirloomRocketPurchased && heirloomRocketEquipped) {
    heirloomRocketEquipped = false;
    saveHeirloomRocketEquipped();
  }

  heirloomPotionPurchased = loadBool(HEIRLOOM_POTION_PURCHASED_KEY, false);
  heirloomPotionEquipped = loadBool(HEIRLOOM_POTION_EQUIPPED_KEY, false);
  if (!heirloomPotionPurchased && heirloomPotionEquipped) {
    heirloomPotionEquipped = false;
    try { localStorage.setItem(HEIRLOOM_POTION_EQUIPPED_KEY, '0'); } catch (e) {}
  }

  heirloomGodiasPurchased = loadBool(HEIRLOOM_GODIAS_PURCHASED_KEY, false);
  heirloomGodiasEquipped = loadBool(HEIRLOOM_GODIAS_EQUIPPED_KEY, false);
  if (!heirloomGodiasPurchased && heirloomGodiasEquipped) {
    heirloomGodiasEquipped = false;
    try { localStorage.setItem(HEIRLOOM_GODIAS_EQUIPPED_KEY, '0'); } catch (e) {}
  }
}

// ===== Rocket Launcher =====
function isHeirloomRocketPurchased() { return heirloomRocketPurchased === true; }
function isRocketLauncherPurchased() { return isHeirloomRocketPurchased(); }

function saveHeirloomRocketPurchased() {
  try { localStorage.setItem(HEIRLOOM_ROCKET_PURCHASED_KEY, heirloomRocketPurchased ? '1' : '0'); } catch (e) {}
}

function saveHeirloomRocketEquipped() {
  try { localStorage.setItem(HEIRLOOM_ROCKET_KEY, heirloomRocketEquipped ? '1' : '0'); } catch (e) {}
}

function saveHeirloomState() {
  saveHeirloomRocketPurchased();
  saveHeirloomRocketEquipped();
  try { localStorage.setItem(HEIRLOOM_POTION_PURCHASED_KEY, heirloomPotionPurchased ? '1' : '0'); } catch (e) {}
  try { localStorage.setItem(HEIRLOOM_POTION_EQUIPPED_KEY, heirloomPotionEquipped ? '1' : '0'); } catch (e) {}
  try { localStorage.setItem(HEIRLOOM_GODIAS_PURCHASED_KEY, heirloomGodiasPurchased ? '1' : '0'); } catch (e) {}
  try { localStorage.setItem(HEIRLOOM_GODIAS_EQUIPPED_KEY, heirloomGodiasEquipped ? '1' : '0'); } catch (e) {}
}

let rocketAmmo = 1;
let rocketAmmoRestoredAt100 = false;
let rockets = [];
let rocketExplosions = [];

function isRocketLauncherEquipped() {
  return heirloomRocketPurchased === true && heirloomRocketEquipped === true;
}

loadHeirloomState();

// ===== Equip limit =====
function countEquippedHeirlooms() {
  let count = 0;
  if (heirloomRocketPurchased && heirloomRocketEquipped) count++;
  if (heirloomPotionPurchased && heirloomPotionEquipped) count++;
  if (heirloomGodiasPurchased && heirloomGodiasEquipped) count++;
  return count;
}

function showHeirloomMaxMessage() {
  const msg = (typeof t === 'function') ? t('heirloom.maxEquipped') : 'Můžeš mít aktivní maximálně 2 heirloomy.';
  showHeirloomRocketMessage(msg);
  showHeirloomPotionMessage(msg);
  showHeirloomGodiasMessage(msg);
}

// ===== Run-state reset =====
function resetRocketRunState() {
  const startAmmo = (typeof getRocketStartingAmmo === 'function') ? getRocketStartingAmmo() : 1;
  rocketAmmo = isRocketLauncherEquipped() ? startAmmo : 0;
  rocketAmmoRestoredAt100 = false;
  rockets = [];
  rocketExplosions = [];
  potionReviveChance = 0.50;
}

function maybeRefreshRocketAmmoAtScore() {
  if (!isRocketLauncherEquipped()) return;
  if (rocketAmmoRestoredAt100) return;
  const threshold = (typeof getRocketReloadScoreRequirement === 'function') ? getRocketReloadScoreRequirement() : 100;
  if (typeof score !== 'number' || score < threshold) return;
  rocketAmmoRestoredAt100 = true;
  if (rocketAmmo < 1) rocketAmmo = 1;
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('toast.rocketRestored.title'), t('toast.rocketRestored.subtitle'), 'upgrade');
  }
}

// ===== Rocket fire =====
function fireRocket() {
  if (gameState !== 'playing') return;
  if (!isRocketLauncherEquipped()) return;
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  if (rocketAmmo <= 0) {
    activeVoiceLine = t('toast.noRocketAmmo.subtitle');
    activeVoiceLineUntil = performance.now() + 1800;
    return;
  }
  rocketAmmo--;

  let target = null;
  for (const p of pipes) {
    if (p.destroyed) continue;
    if (p.x + PIPE_WIDTH > player.x) {
      if (!target || p.x < target.x) target = p;
    }
  }

  rockets.push({
    x: player.x + player.r,
    y: player.y,
    vx: 28,
    radius: 7,
    target: target,
    active: true
  });
}

function destroyPipeFromRocket(pipe) {
  if (!pipe || pipe.destroyed) return;
  pipe.destroyed = true;
  pipe.passed = true;
  if (pipe.coin) pipe.coin.collected = true;
  if (pipe.yang) pipe.yang.collected = true;
  const ex = pipe.x + PIPE_WIDTH / 2;
  const ey = pipe.gapTop + pipe.gap / 2;
  rocketExplosions.push({ x: ex, y: ey, age: 0, maxAge: 14 });
  if (settings && settings.effects && !window.PERF_MOBILE) {
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: ex,
        y: ey,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        life: 32 + Math.random() * 18,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#ff9a3c' : '#f0d080'
      });
    }
  }
}

function updateRockets() {
  if (!rockets.length && !rocketExplosions.length) return;
  for (const r of rockets) {
    if (!r.active) continue;
    r.x += r.vx;
    if (r.target && r.target.destroyed) r.target = null;
    if (!r.target) {
      for (const p of pipes) {
        if (p.destroyed) continue;
        if (p.x + PIPE_WIDTH > r.x - 4) { r.target = p; break; }
      }
    }
    if (r.target && r.x >= r.target.x) {
      const toDestroy = [r.target];
      if (typeof hasStrongerRocket === 'function' && hasStrongerRocket()) {
        let next = null;
        for (const p of pipes) {
          if (p === r.target || p.destroyed) continue;
          if (p.x > r.target.x) {
            if (!next || p.x < next.x) next = p;
          }
        }
        if (next) toDestroy.push(next);
      }
      for (const p of toDestroy) destroyPipeFromRocket(p);
      r.active = false;
      continue;
    }
    if (r.x > canvas.width + 40) r.active = false;
  }
  rockets = rockets.filter(r => r.active);
  for (const ex of rocketExplosions) ex.age++;
  rocketExplosions = rocketExplosions.filter(ex => ex.age < ex.maxAge);
}

function drawRockets() {
  const perf = window.PERF_MOBILE;
  for (const r of rockets) {
    ctx.save();
    if (!perf && settings.effects) {
      ctx.fillStyle = 'rgba(255,160,80,0.45)';
      for (let i = 1; i <= 4; i++) {
        const tx = r.x - i * 8;
        ctx.beginPath();
        ctx.arc(tx, r.y, Math.max(1, r.radius - i * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#3a2418';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0d080';
    ctx.fillRect(r.x - 4, r.y - 2, 8, 4);
    ctx.fillStyle = '#ff5040';
    ctx.beginPath();
    ctx.arc(r.x + r.radius, r.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const ex of rocketExplosions) {
    const t01 = ex.age / ex.maxAge;
    const radius = 8 + t01 * 38;
    ctx.save();
    ctx.globalAlpha = 1 - t01;
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (!perf && settings.effects) {
      ctx.globalAlpha = (1 - t01) * 0.6;
      ctx.fillStyle = '#f0d080';
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRocketLauncher() {
  if (!isRocketLauncherEquipped()) return;
  const px = player.x + player.r * 0.4;
  const py = player.y + player.r * 0.55;
  ctx.save();
  ctx.fillStyle = '#2a1f10';
  ctx.fillRect(px, py, 22, 7);
  ctx.fillStyle = '#3a2e1a';
  ctx.fillRect(px, py + 5, 22, 2);
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(px, py, 22, 1);
  ctx.fillRect(px + 2, py + 7, 18, 1);
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(px + 22, py - 1, 3, 9);
  ctx.fillStyle = rocketAmmo > 0 ? '#ff5040' : '#80c8ff';
  ctx.fillRect(px + 8, py - 2, 3, 2);
  ctx.restore();
}

// ===== HUD — all active heirlooms, top-left =====
function drawRocketHud() {
  if (gameState !== 'playing') return;
  const perf = window.PERF_MOBILE;
  ctx.save();
  ctx.font = 'bold 15px "Cinzel", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!perf) ctx.shadowBlur = 8;

  let hudY = 18;
  const lineH = 22;

  if (isRocketLauncherEquipped()) {
    ctx.fillStyle = rocketAmmo > 0 ? '#f0d080' : '#80c8ff';
    ctx.fillText(`🚀 ${t('hud.rocket')}: ${rocketAmmo}`, 18, hudY);
    hudY += lineH;
  }

  if (heirloomPotionPurchased && heirloomPotionEquipped) {
    ctx.fillStyle = '#a0f0a0';
    const pct = Math.round(potionReviveChance * 100);
    ctx.fillText(`🧪 ${t('hud.potion', { chance: pct })}`, 18, hudY);
    hudY += lineH;
  }

  if (heirloomGodiasPurchased && heirloomGodiasEquipped) {
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`👛 ${t('hud.godias')}`, 18, hudY);
  }

  ctx.restore();
}

// ===== Lektvar Aeternum =====
function isPotionPurchased() { return heirloomPotionPurchased === true; }
function isPotionEquipped() { return heirloomPotionPurchased === true && heirloomPotionEquipped === true; }

function getCurrentWallets() {
  return (typeof wallets === 'number') ? wallets : 0;
}

function getCurrentYangs() {
  return (typeof yang === 'number') ? yang : 0;
}

function getCurrentDragonCoins() {
  if (typeof getDragonCoins === 'function') return getDragonCoins();
  return (typeof dragonCoins === 'number') ? dragonCoins : 0;
}

function canAffordPotion() {
  return getCurrentYangs() >= HEIRLOOM_POTION_COST_YANGS
    && getCurrentWallets() >= HEIRLOOM_POTION_COST_WALLETS
    && getCurrentDragonCoins() >= HEIRLOOM_POTION_COST_DRAGON_COINS;
}

function purchaseHeirloomPotion() {
  if (heirloomPotionPurchased) return;
  if (!canAffordPotion()) {
    showHeirloomPotionMessage(t('heirloom.potion.notEnough'));
    return;
  }
  yang -= HEIRLOOM_POTION_COST_YANGS;
  wallets -= HEIRLOOM_POTION_COST_WALLETS;
  dragonCoins -= HEIRLOOM_POTION_COST_DRAGON_COINS;
  if (typeof saveEconomy === 'function') saveEconomy();
  if (typeof saveDragonCoins === 'function') saveDragonCoins();
  heirloomPotionPurchased = true;
  heirloomPotionEquipped = true;
  try { localStorage.setItem(HEIRLOOM_POTION_PURCHASED_KEY, '1'); } catch (e) {}
  try { localStorage.setItem(HEIRLOOM_POTION_EQUIPPED_KEY, '1'); } catch (e) {}
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('heirloom.potion.unlocked'), t('heirloom.potion.description'), 'upgrade');
  }
  showHeirloomPotionMessage(t('heirloom.potion.unlocked'));
  renderHeirloomPanel();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function toggleHeirloomPotionEquipped() {
  if (!isPotionPurchased()) return;
  if (!heirloomPotionEquipped && countEquippedHeirlooms() >= MAX_EQUIPPED_HEIRLOOMS) {
    showHeirloomMaxMessage();
    return;
  }
  heirloomPotionEquipped = !heirloomPotionEquipped;
  try { localStorage.setItem(HEIRLOOM_POTION_EQUIPPED_KEY, heirloomPotionEquipped ? '1' : '0'); } catch (e) {}
  renderHeirloomPanel();
}

function showHeirloomPotionMessage(message) {
  const el = document.getElementById('heirloomPotionMessage');
  if (el) el.textContent = message || '';
}

// Revive: returns true if revive succeeded (caller should abort endGame flow).
function tryPotionRevive() {
  if (!isPotionEquipped()) return false;
  const roll = Math.random();
  if (roll < potionReviveChance) {
    const oldChancePct = Math.round(potionReviveChance * 100);
    potionReviveChance = Math.max(0.10, potionReviveChance - 0.10);
    const nextPct = Math.round(potionReviveChance * 100);
    // Reposition player to center with brief invincibility
    if (typeof canvas !== 'undefined') player.y = canvas.height / 2;
    player.vy = 0;
    invincibleUntil = performance.now() + 2000;
    activeVoiceLine = `🧪 Lektvar Aeternum tě oživil! Další šance: ${nextPct}%`;
    activeVoiceLineUntil = performance.now() + 3500;
    if (typeof showUnlockToast === 'function') {
      showUnlockToast('🧪 LEKTVAR AETERNUM', `Oživil tě! Další šance: ${nextPct}%`, 'upgrade');
    }
    return true;
  }
  // Revive failed — show brief message before game over proceeds
  if (typeof showUnlockToast === 'function') {
    showUnlockToast('🧪 Lektvar Aeternum', 'Selhal.', 'upgrade');
  }
  return false;
}

// ===== Godiasova peněženka =====
function isGodiasPurchased() { return heirloomGodiasPurchased === true; }
function isGodiasEquipped() { return heirloomGodiasPurchased === true && heirloomGodiasEquipped === true; }

// Returns the currency multiplier for in-game earnings (1 or 3).
function getGodiasWalletMultiplier() {
  return isGodiasEquipped() ? 3 : 1;
}

function canAffordGodias() {
  return getCurrentYangs() >= HEIRLOOM_GODIAS_COST_YANGS
    && getCurrentWallets() >= HEIRLOOM_GODIAS_COST_WALLETS
    && getCurrentDragonCoins() >= HEIRLOOM_GODIAS_COST_DRAGON_COINS;
}

function purchaseHeirloomGodias() {
  if (heirloomGodiasPurchased) return;
  if (!canAffordGodias()) {
    showHeirloomGodiasMessage(t('heirloom.godias.notEnough'));
    return;
  }
  yang -= HEIRLOOM_GODIAS_COST_YANGS;
  wallets -= HEIRLOOM_GODIAS_COST_WALLETS;
  dragonCoins -= HEIRLOOM_GODIAS_COST_DRAGON_COINS;
  if (typeof saveEconomy === 'function') saveEconomy();
  if (typeof saveDragonCoins === 'function') saveDragonCoins();
  heirloomGodiasPurchased = true;
  heirloomGodiasEquipped = true;
  try { localStorage.setItem(HEIRLOOM_GODIAS_PURCHASED_KEY, '1'); } catch (e) {}
  try { localStorage.setItem(HEIRLOOM_GODIAS_EQUIPPED_KEY, '1'); } catch (e) {}
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('heirloom.godias.unlocked'), t('heirloom.godias.description'), 'upgrade');
  }
  showHeirloomGodiasMessage(t('heirloom.godias.unlocked'));
  renderHeirloomPanel();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function toggleHeirloomGodiasEquipped() {
  if (!isGodiasPurchased()) return;
  if (!heirloomGodiasEquipped && countEquippedHeirlooms() >= MAX_EQUIPPED_HEIRLOOMS) {
    showHeirloomMaxMessage();
    return;
  }
  heirloomGodiasEquipped = !heirloomGodiasEquipped;
  try { localStorage.setItem(HEIRLOOM_GODIAS_EQUIPPED_KEY, heirloomGodiasEquipped ? '1' : '0'); } catch (e) {}
  renderHeirloomPanel();
}

function showHeirloomGodiasMessage(message) {
  const el = document.getElementById('heirloomGodiasMessage');
  if (el) el.textContent = message || '';
}

// ===== Rocket purchase =====
function canAffordHeirloomRocket() {
  return getCurrentYangs() >= HEIRLOOM_ROCKET_COST_YANGS
    && getCurrentDragonCoins() >= HEIRLOOM_ROCKET_COST_DRAGON_COINS;
}

function spendHeirloomRocketCost() {
  if (!canAffordHeirloomRocket()) return false;
  yang -= HEIRLOOM_ROCKET_COST_YANGS;
  dragonCoins -= HEIRLOOM_ROCKET_COST_DRAGON_COINS;
  if (typeof saveEconomy === 'function') saveEconomy();
  if (typeof saveDragonCoins === 'function') saveDragonCoins();
  return true;
}

function purchaseHeirloomRocket() {
  if (heirloomRocketPurchased) return;
  if (!canAffordHeirloomRocket()) {
    showHeirloomRocketMessage(t('heirloom.rocket.notEnough'));
    return;
  }
  if (!spendHeirloomRocketCost()) {
    showHeirloomRocketMessage(t('heirloom.rocket.notEnough'));
    return;
  }
  heirloomRocketPurchased = true;
  heirloomRocketEquipped = true;
  saveHeirloomState();
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('heirloom.rocket.unlocked'), t('heirloom.rocket.description'), 'upgrade');
  }
  showHeirloomRocketMessage(t('heirloom.rocket.unlocked'));
  renderHeirloomPanel();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function toggleHeirloomRocketEquipped() {
  if (!isRocketLauncherPurchased()) return;
  if (!heirloomRocketEquipped && countEquippedHeirlooms() >= MAX_EQUIPPED_HEIRLOOMS) {
    showHeirloomMaxMessage();
    return;
  }
  heirloomRocketEquipped = !heirloomRocketEquipped;
  saveHeirloomRocketEquipped();
  if (!heirloomRocketEquipped) {
    rockets = [];
    rocketAmmo = 0;
  } else if (gameState === 'playing' && rocketAmmo < 1 && !rocketAmmoRestoredAt100) {
    rocketAmmo = (typeof getRocketStartingAmmo === 'function') ? getRocketStartingAmmo() : 1;
  }
  renderHeirloomPanel();
}

function showHeirloomRocketMessage(message) {
  const statusEl = document.getElementById('heirloomRocketMessage');
  if (statusEl) statusEl.textContent = message || '';
}

// ===== Panel render =====
function renderHeirloomPanel() {
  // Update shared currency display
  const yangEl = document.getElementById('heirloomYangs');
  const walletsEl = document.getElementById('heirloomWallets');
  const dcEl = document.getElementById('heirloomDragonCoins');
  if (yangEl && typeof yang === 'number') yangEl.textContent = String(yang);
  if (walletsEl && typeof wallets === 'number') walletsEl.textContent = String(wallets);
  if (dcEl && typeof dragonCoins === 'number') dcEl.textContent = String(dragonCoins);

  // ── Rocket ──
  const rocketStatusEl = document.getElementById('heirloomRocketStatus');
  const rocketBtnEl = document.getElementById('toggleHeirloomRocketBtn');
  if (!isRocketLauncherPurchased()) {
    if (rocketStatusEl) rocketStatusEl.textContent = t('heirloom.rocket.locked');
    if (rocketBtnEl) {
      rocketBtnEl.textContent = t('heirloom.rocket.unlock');
      rocketBtnEl.onclick = purchaseHeirloomRocket;
      rocketBtnEl.disabled = false;
      rocketBtnEl.classList.toggle('disabled', !canAffordHeirloomRocket());
    }
  } else {
    if (rocketStatusEl) rocketStatusEl.textContent = isRocketLauncherEquipped() ? t('heirloom.rocket.equipped') : t('heirloom.rocket.unequipped');
    if (rocketBtnEl) {
      rocketBtnEl.textContent = isRocketLauncherEquipped() ? t('heirloom.rocket.unequipAction') : t('heirloom.rocket.equipAction');
      rocketBtnEl.onclick = toggleHeirloomRocketEquipped;
      rocketBtnEl.disabled = false;
      rocketBtnEl.classList.remove('disabled');
    }
  }

  // ── Lektvar Aeternum ──
  const potionStatusEl = document.getElementById('heirloomPotionStatus');
  const potionBtnEl = document.getElementById('toggleHeirloomPotionBtn');
  if (!isPotionPurchased()) {
    if (potionStatusEl) potionStatusEl.textContent = t('heirloom.potion.locked');
    if (potionBtnEl) {
      potionBtnEl.textContent = t('heirloom.potion.unlock');
      potionBtnEl.onclick = purchaseHeirloomPotion;
      potionBtnEl.disabled = false;
      potionBtnEl.classList.toggle('disabled', !canAffordPotion());
    }
  } else {
    if (potionStatusEl) potionStatusEl.textContent = isPotionEquipped() ? t('heirloom.potion.equipped') : t('heirloom.potion.unequipped');
    if (potionBtnEl) {
      potionBtnEl.textContent = isPotionEquipped() ? t('heirloom.potion.unequipAction') : t('heirloom.potion.equipAction');
      potionBtnEl.onclick = toggleHeirloomPotionEquipped;
      potionBtnEl.disabled = false;
      potionBtnEl.classList.remove('disabled');
    }
  }

  // ── Godiasova peněženka ──
  const godiasStatusEl = document.getElementById('heirloomGodiasStatus');
  const godiasBtnEl = document.getElementById('toggleHeirloomGodiasBtn');
  if (!isGodiasPurchased()) {
    if (godiasStatusEl) godiasStatusEl.textContent = t('heirloom.godias.locked');
    if (godiasBtnEl) {
      godiasBtnEl.textContent = t('heirloom.godias.unlock');
      godiasBtnEl.onclick = purchaseHeirloomGodias;
      godiasBtnEl.disabled = false;
      godiasBtnEl.classList.toggle('disabled', !canAffordGodias());
    }
  } else {
    if (godiasStatusEl) godiasStatusEl.textContent = isGodiasEquipped() ? t('heirloom.godias.equipped') : t('heirloom.godias.unequipped');
    if (godiasBtnEl) {
      godiasBtnEl.textContent = isGodiasEquipped() ? t('heirloom.godias.unequipAction') : t('heirloom.godias.equipAction');
      godiasBtnEl.onclick = toggleHeirloomGodiasEquipped;
      godiasBtnEl.disabled = false;
      godiasBtnEl.classList.remove('disabled');
    }
  }
}
