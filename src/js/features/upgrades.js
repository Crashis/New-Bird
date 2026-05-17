// Permanent upgrades — persistent across runs, stored in localStorage.
// Štěstí dobrodruha: 7 levelů, ovlivňuje spawn měn během runu.
// Rocket upgrady (Zásobník raket / Rychlé přebití / Silnější raketa) — odemčené
// až po koupi heirloomu Raketomet.

const PLAYER_UPGRADES_KEY = 'nw_flappy_player_upgrades';

const UPGRADE_DEFS = {
  currencyLuck: {
    max: 7,
    costs: [
      { yang: 100 }, { yang: 150 }, { yang: 200 }, { yang: 250 },
      { yang: 300 }, { yang: 350 }, { yang: 400 }
    ]
  },
  rocketExtraAmmo: {
    max: 3,
    costs: [
      { yang: 300, dragonCoins: 3 },
      { yang: 600, dragonCoins: 6 },
      { yang: 900, dragonCoins: 9 }
    ],
    requiresRocket: true
  },
  rocketReloadSpeed: {
    max: 3,
    costs: [
      { wallets: 9 },
      { wallets: 18 },
      { wallets: 27 }
    ],
    requiresRocket: true
  },
  rocketPower: {
    max: 1,
    costs: [
      { dragonCoins: 15 }
    ],
    requiresRocket: true
  }
};

const ROCKET_RELOAD_SCORE_BY_LEVEL = [100, 85, 70, 50];

let playerUpgrades = {
  currencyLuck: 0,
  rocketExtraAmmo: 0,
  rocketReloadSpeed: 0,
  rocketPower: 0
};

function loadPlayerUpgrades() {
  try {
    const raw = localStorage.getItem(PLAYER_UPGRADES_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    for (const key of Object.keys(playerUpgrades)) {
      const v = parseInt(parsed[key], 10);
      if (Number.isFinite(v) && v >= 0) {
        const max = (UPGRADE_DEFS[key] && UPGRADE_DEFS[key].max) || 0;
        playerUpgrades[key] = Math.min(max, v);
      }
    }
  } catch (e) {}
}

function savePlayerUpgrades() {
  try { localStorage.setItem(PLAYER_UPGRADES_KEY, JSON.stringify(playerUpgrades)); } catch (e) {}
}

loadPlayerUpgrades();

function getUpgradeLevel(key) {
  return playerUpgrades[key] || 0;
}

function getUpgradeMaxLevel(key) {
  return (UPGRADE_DEFS[key] && UPGRADE_DEFS[key].max) || 0;
}

function getNextUpgradeCost(key) {
  const def = UPGRADE_DEFS[key];
  if (!def) return null;
  const lvl = getUpgradeLevel(key);
  if (lvl >= def.max) return null;
  return def.costs[lvl] || null;
}

function hasRocketLauncher() {
  return typeof isHeirloomRocketPurchased === 'function' && isHeirloomRocketPurchased();
}

function isUpgradeUnlocked(key) {
  const def = UPGRADE_DEFS[key];
  if (!def) return false;
  if (def.requiresRocket && !hasRocketLauncher()) return false;
  return true;
}

function canAffordUpgradeCost(cost) {
  if (!cost) return false;
  if (cost.yang && (typeof yang !== 'number' || yang < cost.yang)) return false;
  if (cost.wallets && (typeof wallets !== 'number' || wallets < cost.wallets)) return false;
  if (cost.dragonCoins) {
    const dc = (typeof dragonCoins === 'number') ? dragonCoins : 0;
    if (dc < cost.dragonCoins) return false;
  }
  return true;
}

function canBuyUpgrade(key) {
  if (!isUpgradeUnlocked(key)) return false;
  const cost = getNextUpgradeCost(key);
  if (!cost) return false;
  return canAffordUpgradeCost(cost);
}

function spendUpgradeCost(cost) {
  if (!canAffordUpgradeCost(cost)) return false;
  if (cost.yang) yang -= cost.yang;
  if (cost.wallets) wallets -= cost.wallets;
  if (cost.dragonCoins) dragonCoins -= cost.dragonCoins;
  if (typeof saveEconomy === 'function') saveEconomy();
  if (typeof saveDragonCoins === 'function') saveDragonCoins();
  return true;
}

function buyUpgrade(key) {
  const def = UPGRADE_DEFS[key];
  if (!def) return;
  if (!isUpgradeUnlocked(key)) {
    showUpgradesMessage(t('upgrades.requiresRocket'));
    return;
  }
  if (getUpgradeLevel(key) >= def.max) return;
  const cost = getNextUpgradeCost(key);
  if (!cost) return;
  if (!canAffordUpgradeCost(cost)) {
    showUpgradesMessage(t('upgrades.notEnough'));
    return;
  }
  if (!spendUpgradeCost(cost)) {
    showUpgradesMessage(t('upgrades.notEnough'));
    return;
  }
  playerUpgrades[key] = getUpgradeLevel(key) + 1;
  savePlayerUpgrades();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
  }
  renderUpgradesPanel();
}

// === Spawn bonuses ===
function getCurrencyLuckYangBonus() {
  const lvl = getUpgradeLevel('currencyLuck');
  if (lvl >= 2) return 0.10;
  if (lvl >= 1) return 0.05;
  return 0;
}

function getCurrencyLuckWalletChance() {
  const lvl = getUpgradeLevel('currencyLuck');
  if (lvl >= 4) return 0.10;
  if (lvl >= 3) return 0.05;
  return 0;
}

function getCurrencyLuckDragonCoinChance() {
  const lvl = getUpgradeLevel('currencyLuck');
  if (lvl >= 7) return 0.03;
  if (lvl >= 6) return 0.02;
  if (lvl >= 5) return 0.01;
  return 0;
}

function getCurrencySpawnBonus() {
  return {
    yang: getCurrencyLuckYangBonus(),
    wallet: getCurrencyLuckWalletChance(),
    dragonCoin: getCurrencyLuckDragonCoinChance()
  };
}

// === Rocket helpers ===
function getRocketBaseAmmo() { return 1; }
function getRocketStartingAmmo() {
  return getRocketBaseAmmo() + getUpgradeLevel('rocketExtraAmmo');
}
function getRocketReloadScoreRequirement() {
  const lvl = getUpgradeLevel('rocketReloadSpeed');
  return ROCKET_RELOAD_SCORE_BY_LEVEL[Math.min(lvl, ROCKET_RELOAD_SCORE_BY_LEVEL.length - 1)];
}
function hasStrongerRocket() {
  return getUpgradeLevel('rocketPower') >= 1;
}

// === UI ===
function showUpgradesMessage(message) {
  const el = document.getElementById('upgradesMessage');
  if (el) el.textContent = message || '';
}

function formatCost(cost) {
  if (!cost) return '';
  const parts = [];
  if (cost.yang) parts.push(`${cost.yang} ${t('upgrades.unit.yang')}`);
  if (cost.wallets) parts.push(`${cost.wallets} ${t('upgrades.unit.wallets')}`);
  if (cost.dragonCoins) parts.push(`${cost.dragonCoins} ${t('upgrades.unit.dc')}`);
  return parts.join(' + ');
}

function describeCurrencyLuckEffect(level) {
  if (level <= 0) return t('upgrades.luck.effect.none');
  if (level === 1) return t('upgrades.luck.effect.l1');
  if (level === 2) return t('upgrades.luck.effect.l2');
  if (level === 3) return t('upgrades.luck.effect.l3');
  if (level === 4) return t('upgrades.luck.effect.l4');
  if (level === 5) return t('upgrades.luck.effect.l5');
  if (level === 6) return t('upgrades.luck.effect.l6');
  return t('upgrades.luck.effect.l7');
}

function describeReloadEffect(level) {
  return t('upgrades.reload.effect', { val: ROCKET_RELOAD_SCORE_BY_LEVEL[Math.min(level, 3)] });
}

function renderUpgradesPanel() {
  const panel = document.getElementById('upgradesPanel');
  if (!panel) return;

  // Currency display
  const yangEl = document.getElementById('upgradesYangs');
  const walletsEl = document.getElementById('upgradesWallets');
  const dcEl = document.getElementById('upgradesDragonCoins');
  if (yangEl && typeof yang === 'number') yangEl.textContent = String(yang);
  if (walletsEl && typeof wallets === 'number') walletsEl.textContent = String(wallets);
  if (dcEl && typeof dragonCoins === 'number') dcEl.textContent = String(dragonCoins);

  renderUpgradeCard('currencyLuck', {
    levelEl: 'upgradeLuckLevel',
    effectEl: 'upgradeLuckEffect',
    nextEl: 'upgradeLuckNext',
    costEl: 'upgradeLuckCost',
    btnEl: 'upgradeLuckBtn',
    cardEl: 'upgradeLuckCard',
    describe: describeCurrencyLuckEffect
  });

  renderUpgradeCard('rocketExtraAmmo', {
    levelEl: 'upgradeAmmoLevel',
    effectEl: 'upgradeAmmoEffect',
    nextEl: 'upgradeAmmoNext',
    costEl: 'upgradeAmmoCost',
    btnEl: 'upgradeAmmoBtn',
    cardEl: 'upgradeAmmoCard',
    describe: (lvl) => t('upgrades.ammo.effect', { val: getRocketBaseAmmo() + lvl })
  });

  renderUpgradeCard('rocketReloadSpeed', {
    levelEl: 'upgradeReloadLevel',
    effectEl: 'upgradeReloadEffect',
    nextEl: 'upgradeReloadNext',
    costEl: 'upgradeReloadCost',
    btnEl: 'upgradeReloadBtn',
    cardEl: 'upgradeReloadCard',
    describe: describeReloadEffect
  });

  renderUpgradeCard('rocketPower', {
    levelEl: 'upgradePowerLevel',
    effectEl: 'upgradePowerEffect',
    nextEl: 'upgradePowerNext',
    costEl: 'upgradePowerCost',
    btnEl: 'upgradePowerBtn',
    cardEl: 'upgradePowerCard',
    describe: (lvl) => lvl >= 1 ? t('upgrades.power.effect.on') : t('upgrades.power.effect.off')
  });
}

function renderUpgradeCard(key, ids) {
  const def = UPGRADE_DEFS[key];
  if (!def) return;
  const lvl = getUpgradeLevel(key);
  const max = def.max;
  const unlocked = isUpgradeUnlocked(key);
  const atMax = lvl >= max;

  const levelEl = document.getElementById(ids.levelEl);
  const effectEl = document.getElementById(ids.effectEl);
  const nextEl = document.getElementById(ids.nextEl);
  const costEl = document.getElementById(ids.costEl);
  const btnEl = document.getElementById(ids.btnEl);
  const cardEl = document.getElementById(ids.cardEl);

  if (cardEl) cardEl.classList.toggle('upgrade-locked', !unlocked);

  if (levelEl) {
    levelEl.textContent = atMax
      ? t('upgrades.max')
      : t('upgrades.levelOf', { cur: lvl, max });
  }
  if (effectEl) effectEl.textContent = ids.describe(lvl);
  if (nextEl) {
    nextEl.textContent = atMax ? '' : (t('upgrades.nextLabel') + ' ' + ids.describe(lvl + 1));
  }
  if (costEl) {
    if (!unlocked) {
      costEl.textContent = t('upgrades.requiresRocket');
    } else if (atMax) {
      costEl.textContent = '';
    } else {
      costEl.textContent = t('upgrades.costLabel') + ' ' + formatCost(getNextUpgradeCost(key));
    }
  }
  if (btnEl) {
    if (!unlocked) {
      btnEl.textContent = t('upgrades.locked');
      btnEl.disabled = true;
      btnEl.classList.add('disabled');
    } else if (atMax) {
      btnEl.textContent = t('upgrades.max');
      btnEl.disabled = true;
      btnEl.classList.add('disabled');
    } else {
      btnEl.textContent = t('upgrades.upgrade');
      const can = canBuyUpgrade(key);
      btnEl.disabled = !can;
      btnEl.classList.toggle('disabled', !can);
      btnEl.onclick = () => buyUpgrade(key);
    }
  }
}
