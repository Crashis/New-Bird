function updateEconomyUi() {
  const gameYang = document.getElementById('gameYang');
  const gameWallets = document.getElementById('gameWallets');
  const shopYang = document.getElementById('shopYang');
  const shopWallets = document.getElementById('shopWallets');
  const menuYang = document.getElementById('menuYang');
  const menuWallets = document.getElementById('menuWallets');
  if (gameYang) gameYang.textContent = yang;
  if (gameWallets) gameWallets.textContent = wallets;
  if (shopYang) shopYang.textContent = yang;
  if (shopWallets) shopWallets.textContent = wallets;
  if (menuYang) menuYang.textContent = yang;
  if (menuWallets) menuWallets.textContent = wallets;

  const shieldLevel = document.getElementById('shieldStartLevel');
  const shieldBtn = document.getElementById('buyShieldStartBtn');
  if (shieldLevel) shieldLevel.textContent = shieldStartOwned ? 'Vlastníš' : 'Nevlastníš';
  if (shieldBtn) {
    shieldBtn.textContent = shieldStartOwned ? 'Koupeno' : 'Koupit — 100 Yangů';
    shieldBtn.disabled = shieldStartOwned || yang < UPGRADE_COST;
    shieldBtn.classList.toggle('disabled', shieldBtn.disabled);
  }

  const invLevel = document.getElementById('invincibilityLevel');
  const invBtn = document.getElementById('buyInvincibilityBtn');
  if (invLevel) invLevel.textContent = `Level ${invincibilityLevel}/3 (+${(invincibilityLevel * 0.5).toFixed(1)}s)`;
  if (invBtn) {
    invBtn.textContent = invincibilityLevel >= 3 ? 'Maximum' : 'Koupit — 100 Yangů';
    invBtn.disabled = invincibilityLevel >= 3 || yang < UPGRADE_COST;
    invBtn.classList.toggle('disabled', invBtn.disabled);
  }

  const dyLevel = document.getElementById('doubleYangLevel');
  const dyBtn = document.getElementById('buyDoubleYangBtn');
  if (dyLevel) dyLevel.textContent = `Level ${doubleYangLevel}/${DOUBLE_YANG_MAX_LEVEL} (${(getDoubleYangDuration() / 1000).toFixed(1)}s)`;
  if (dyBtn) {
    dyBtn.textContent = doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL ? 'Maximum' : 'Koupit — 100 Yangů';
    dyBtn.disabled = doubleYangLevel >= DOUBLE_YANG_MAX_LEVEL || yang < UPGRADE_COST;
    dyBtn.classList.toggle('disabled', dyBtn.disabled);
  }

  const cbLevel = document.getElementById('crownBonusLevel');
  const cbBtn = document.getElementById('buyCrownBonusBtn');
  if (cbLevel) cbLevel.textContent = `Level ${crownBonusLevel}/${CROWN_BONUS_MAX_LEVEL} (+${getCrownBonusValue()} skóre)`;
  if (cbBtn) {
    cbBtn.textContent = crownBonusLevel >= CROWN_BONUS_MAX_LEVEL ? 'Maximum' : 'Koupit — 100 Yangů';
    cbBtn.disabled = crownBonusLevel >= CROWN_BONUS_MAX_LEVEL || yang < UPGRADE_COST;
    cbBtn.classList.toggle('disabled', cbBtn.disabled);
  }
}

function showShopMessage(message) {
  const el = document.getElementById('shopMessage');
  if (el) el.textContent = message || '';
}
