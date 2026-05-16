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

function buyInvincibilityUpgrade() {
  if (invincibilityLevel >= 3) return;
  const cost = UPGRADE_LEVEL_COSTS[invincibilityLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  invincibilityLevel++;
  saveEconomy();
  updateEconomyUi();
  showShopMessage(t('shop.invExtended', { dur: (2 + invincibilityLevel * 0.5).toFixed(1) }));
  showUnlockToast(t('toast.upgradeUnlocked'), t('toast.upgradeSubtitle'), 'upgrade');
}

function buyDoubleYangUpgrade() {
  if (doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL) return;
  const cost = UPGRADE_LEVEL_COSTS[doubleYangLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
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
  const cost = UPGRADE_LEVEL_COSTS[crownBonusLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
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
  return INVINCIBLE_DURATION_MS + invincibilityLevel * 500;
}

function getDoubleYangDuration() {
  return DOUBLE_YANG_BASE_MS + doubleYangLevel * DOUBLE_YANG_BONUS_MS;
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

function buyMaxShields2() {
  if (maxShields2Owned) return;
  const cost = 500;
  if (!spendYang(cost)) {
    showShopMessage(t('shop.noYangFor', { cost }));
    return;
  }
  maxShields2Owned = true;
  saveEconomy();
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
