function updateEconomyUi() {
  const gameYang = document.getElementById('gameYang');
  const gameWallets = document.getElementById('gameWallets');
  const gameDragonCoins = document.getElementById('gameDragonCoins');
  const shopYang = document.getElementById('shopYang');
  const shopWallets = document.getElementById('shopWallets');
  if (gameYang) gameYang.textContent = yang;
  if (gameWallets) gameWallets.textContent = wallets;
  if (gameDragonCoins) gameDragonCoins.textContent = (typeof dragonCoins === 'number') ? dragonCoins : 0;
  if (shopYang) shopYang.textContent = yang;
  if (shopWallets) shopWallets.textContent = wallets;
  if (typeof renderShellGamePanel === 'function') renderShellGamePanel();
  if (typeof renderHeirloomPanel === 'function') renderHeirloomPanel();

  const shieldLevel = document.getElementById('shieldStartLevel');
  const shieldBtn = document.getElementById('buyShieldStartBtn');
  if (shieldLevel) shieldLevel.textContent = shieldStartOwned ? t('economy.owned') : t('economy.notOwned');
  if (shieldBtn) {
    const shieldCost = UPGRADE_LEVEL_COSTS[0];
    shieldBtn.textContent = shieldStartOwned ? t('economy.bought') : t('economy.buyFor', { cost: shieldCost });
    shieldBtn.disabled = shieldStartOwned || yang < shieldCost;
    shieldBtn.classList.toggle('disabled', shieldBtn.disabled);
  }

  const invLevel = document.getElementById('invincibilityLevel');
  const invBtn = document.getElementById('buyInvincibilityBtn');
  if (invLevel) invLevel.textContent = t('economy.invLevel', {
    cur: invincibilityLevel,
    bonus: (invincibilityLevel * 0.5).toFixed(1)
  });
  if (invBtn) {
    const invCost = UPGRADE_LEVEL_COSTS[invincibilityLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
    invBtn.textContent = invincibilityLevel >= 3 ? t('economy.maximum') : t('economy.buyFor', { cost: invCost });
    invBtn.disabled = invincibilityLevel >= 3 || yang < invCost;
    invBtn.classList.toggle('disabled', invBtn.disabled);
  }

  const dyLevel = document.getElementById('doubleYangLevel');
  const dyBtn = document.getElementById('buyDoubleYangBtn');
  if (dyLevel) dyLevel.textContent = t('economy.dyLevel', {
    cur: doubleYangLevel,
    max: DOUBLE_YANG_MAX_LEVEL,
    dur: (getDoubleYangDuration() / 1000).toFixed(1)
  });
  if (dyBtn) {
    const dyCost = UPGRADE_LEVEL_COSTS[doubleYangLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
    dyBtn.textContent = doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL ? t('economy.maximum') : t('economy.buyFor', { cost: dyCost });
    dyBtn.disabled = doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL || yang < dyCost;
    dyBtn.classList.toggle('disabled', dyBtn.disabled);
  }

  const cbLevel = document.getElementById('crownBonusLevel');
  const cbBtn = document.getElementById('buyCrownBonusBtn');
  if (cbLevel) cbLevel.textContent = t('economy.crownLevel', {
    cur: crownBonusLevel,
    max: CROWN_BONUS_MAX_LEVEL,
    val: getCrownBonusValue()
  });
  if (cbBtn) {
    const cbCost = UPGRADE_LEVEL_COSTS[crownBonusLevel] || UPGRADE_LEVEL_COSTS[UPGRADE_LEVEL_COSTS.length - 1];
    cbBtn.textContent = crownBonusLevel >= CROWN_BONUS_MAX_LEVEL ? t('economy.maximum') : t('economy.buyFor', { cost: cbCost });
    cbBtn.disabled = crownBonusLevel >= CROWN_BONUS_MAX_LEVEL || yang < cbCost;
    cbBtn.classList.toggle('disabled', cbBtn.disabled);
  }

  const ms2Level = document.getElementById('maxShields2Level');
  const ms2Btn = document.getElementById('buyMaxShields2Btn');
  if (ms2Level) ms2Level.textContent = maxShields2Owned ? t('economy.owned') : t('economy.notOwned');
  if (ms2Btn) {
    ms2Btn.textContent = maxShields2Owned ? t('economy.bought') : t('economy.buyFor', { cost: 500 });
    ms2Btn.disabled = maxShields2Owned || yang < 500;
    ms2Btn.classList.toggle('disabled', ms2Btn.disabled);
  }
}

function showShopMessage(message) {
  const el = document.getElementById('shopMessage');
  if (el) el.textContent = message || '';
}
