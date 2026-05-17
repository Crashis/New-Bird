function spendYang(amount) {
  if (yang < amount) return false;
  checkAchievements();
  yang -= amount;
  saveEconomy();
  updateEconomyUi();
  checkAchievements();
  return true;
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

function buyInvincibilityUpgrade() {
  if (invincibilityLevel >= INVINCIBILITY_MAX_LEVEL) return;
  const cost = getInvincibilityCost(invincibilityLevel);
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  invincibilityLevel++;
  saveEconomy();
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
  return maxShields2Owned ? 2 : 1;
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
