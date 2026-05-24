function spendYang(amount) {
  if (yang < amount) return false;
  checkAchievements();
  yang -= amount;
  saveEconomy();
  updateEconomyUi();
  checkAchievements();
  return true;
}

function queueShopUpgradeCloudSave() {
  try {
    if (window.NWCloudSave && typeof window.NWCloudSave.queueCloudSave === 'function') {
      window.NWCloudSave.queueCloudSave('upgrade');
    }
  } catch (e) {}
}

function buyShieldStart() {
  if (shieldStartOwned) return;
  const cost = UPGRADE_LEVEL_COSTS[0];
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  shieldStartOwned = true;
  saveEconomy();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.shieldBought'));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function getInvincibilityCost(level) {
  if (level >= INVINCIBILITY_MAX_LEVEL) return null;
  return INVINCIBILITY_COSTS[level];
}

function getDoubleYangCost(level) {
  if (level >= DOUBLE_YANG_MAX_LEVEL) return null;
  return DOUBLE_YANG_COSTS[level];
}

function getCrownBonusCost(level) {
  if (level >= CROWN_BONUS_MAX_LEVEL) return null;
  return CROWN_BONUS_COSTS[level];
}

function getShieldRegenCost(level) {
  if (level >= SHIELD_REGEN_MAX_LEVEL) return null;
  return SHIELD_REGEN_COSTS[level];
}

function getShieldRegenSeconds() {
  if (shieldRegenLevel <= 0) return 0;
  return SHIELD_REGEN_SECONDS[Math.min(SHIELD_REGEN_MAX_LEVEL, shieldRegenLevel) - 1];
}

function getShieldRegenCooldownFrames() {
  const sec = getShieldRegenSeconds();
  return sec > 0 ? Math.round(sec * 60) : 0;
}

function getShieldRegenCooldownMs() {
  const sec = getShieldRegenSeconds();
  return sec > 0 ? sec * 1000 : 0;
}

// Regenerace je výslovně mimo boss fighty / speciální módy.
function isShieldRegenAllowedInCurrentMode() {
  if (typeof isBossFightActive === 'function' && isBossFightActive()) return false;
  // 'normal' a 'moonLevel' regeneraci dovolují, jakýkoli další speciální mód ne.
  if (typeof currentGameMode === 'string'
      && currentGameMode !== 'normal'
      && currentGameMode !== 'moonLevel') {
    return false;
  }
  return true;
}

function buyShieldRegenUpgrade() {
  if (shieldRegenLevel >= SHIELD_REGEN_MAX_LEVEL) return;
  const cost = getShieldRegenCost(shieldRegenLevel);
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  shieldRegenLevel++;
  saveEconomy();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.shieldRegenUp', { sec: getShieldRegenSeconds().toFixed(1) }));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function buyInvincibilityUpgrade() {
  if (invincibilityLevel >= INVINCIBILITY_MAX_LEVEL) return;
  const cost = getInvincibilityCost(invincibilityLevel);
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  invincibilityLevel++;
  saveEconomy();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.invExtended', { dur: (getInvincibleDurationMs() / 1000).toFixed(1) }));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function buyDoubleYangUpgrade() {
  if (doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL) return;
  const cost = getDoubleYangCost(doubleYangLevel);
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  doubleYangLevel++;
  saveEconomy();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.dyExtended', { dur: (getDoubleYangDuration() / 1000).toFixed(1) }));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function buyCrownBonusUpgrade() {
  if (crownBonusLevel >= CROWN_BONUS_MAX_LEVEL) return;
  const cost = getCrownBonusCost(crownBonusLevel);
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  crownBonusLevel++;
  saveEconomy();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.crownUp', { val: getCrownBonusValue() }));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function getInvincibleDurationMs() {
  const baseLevels = Math.min(3, invincibilityLevel);
  const extLevels = Math.max(0, invincibilityLevel - 3);
  return INVINCIBLE_DURATION_MS + baseLevels * 500 + extLevels * 200;
}

function getDoubleYangDuration() {
  const baseLevels = Math.min(2, doubleYangLevel);
  const extLevels = Math.max(0, doubleYangLevel - 2);
  return DOUBLE_YANG_BASE_MS + baseLevels * DOUBLE_YANG_BONUS_MS + extLevels * 200;
}

function getCrownBonusValue() {
  return CROWN_BONUS_BASE + crownBonusLevel;
}

function isDoubleYangActive() {
  return performance.now() < doubleYangUntil;
}

function isAmazonNerfActive() {
  return performance.now() < amazonNerfUntil;
}

function getAmazonNerfSpeedMultiplier() {
  return isAmazonNerfActive() ? amazonNerfSpeedMult : 1.0;
}

function getMaxShields() {
  let max = maxShields2Owned ? 2 : 1;
  if (typeof isKotlarEquipped === 'function' && isKotlarEquipped()) {
    max += 1;
  }
  return max;
}

const MAX_SHIELDS_2_COST = {
  yang: 666,
  wallets: 6,
  dragonCoins: 6
};

function getMaxShields2PriceText() {
  const label = t('shop.maxShields2Buy');
  return label === 'shop.maxShields2Buy'
    ? 'Koupit — 666 Yangů · 6 Peněženek · 6 Dračích mincí'
    : label;
}

function buyMaxShields2() {
  if (maxShields2Owned) return;
  const cost = MAX_SHIELDS_2_COST;
  if (yang < cost.yang || wallets < cost.wallets || dragonCoins < cost.dragonCoins) {
    showShopMessage(t('shop.maxShields2NotEnough'));
    return;
  }
  yang -= cost.yang;
  wallets -= cost.wallets;
  dragonCoins -= cost.dragonCoins;
  maxShields2Owned = true;
  saveEconomy();
  saveDragonCoins();
  queueShopUpgradeCloudSave();
  updateEconomyUi();
  showShopMessage(t('shop.maxShields2Bought'));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function pickPowerupType() {
  const r = Math.random();
  let acc = 0;
  for (const [type, weight] of POWERUP_TYPE_WEIGHTS) {
    acc += weight;
    if (r < acc) return type;
  }
  return POWERUP_TYPE_WEIGHTS[0][0];
}
