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
  if (!spendYang(UPGRADE_COST)) {
    showShopMessage('Nemáš dost Yangů. Potřebuješ 100.');
    return;
  }
  shieldStartOwned = true;
  saveEconomy();
  updateEconomyUi();
  showShopMessage('Shield Start koupen. Další run začne se štítem.');
  showUnlockToast('UPGRADE ODEMČEN', 'Amazon účetní oddělení nesouhlasí.', 'upgrade');
}

function buyInvincibilityUpgrade() {
  if (invincibilityLevel >= 3) return;
  if (!spendYang(UPGRADE_COST)) {
    showShopMessage('Nemáš dost Yangů. Potřebuješ 100.');
    return;
  }
  invincibilityLevel++;
  saveEconomy();
  updateEconomyUi();
  showShopMessage(`Nesmrtelnost prodloužena na ${(2 + invincibilityLevel * 0.5).toFixed(1)}s.`);
  showUnlockToast('UPGRADE ODEMČEN', 'Amazon účetní oddělení nesouhlasí.', 'upgrade');
}

function buyDoubleYangUpgrade() {
  if (doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL) return;
  if (!spendYang(UPGRADE_COST)) {
    showShopMessage('Nemáš dost Yangů. Potřebuješ 100.');
    return;
  }
  doubleYangLevel++;
  saveEconomy();
  updateEconomyUi();
  showShopMessage(`Double Yang prodloužen na ${(getDoubleYangDuration() / 1000).toFixed(1)}s.`);
  showUnlockToast('UPGRADE ODEMČEN', 'Amazon účetní oddělení nesouhlasí.', 'upgrade');
}

function buyCrownBonusUpgrade() {
  if (crownBonusLevel >= CROWN_BONUS_MAX_LEVEL) return;
  if (!spendYang(UPGRADE_COST)) {
    showShopMessage('Nemáš dost Yangů. Potřebuješ 100.');
    return;
  }
  crownBonusLevel++;
  saveEconomy();
  updateEconomyUi();
  showShopMessage(`Crown Bonus zvýšen na +${getCrownBonusValue()} skóre.`);
  showUnlockToast('UPGRADE ODEMČEN', 'Amazon účetní oddělení nesouhlasí.', 'upgrade');
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

function pickPowerupType() {
  const r = Math.random();
  let acc = 0;
  for (const [type, weight] of POWERUP_TYPE_WEIGHTS) {
    acc += weight;
    if (r < acc) return type;
  }
  return POWERUP_TYPE_WEIGHTS[0][0];
}
