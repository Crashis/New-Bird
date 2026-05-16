// ===== SKINS =====

function getSelectedSkin() {
  return SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
}

function setSelectedSkin(id) {
  selectedSkinId = id;
  try { localStorage.setItem('nw_flappy_selected_skin', id); } catch (e) {}
}

function toggleSkinsPanel(forceOpen) {
  const panel = document.getElementById('skinsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = 'Skiny si vybereš až mimo aktivní let. Amazon módní přehlídku v letu neplatí.';
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  if (typeof closeOtherPanels === 'function') {
    closeOtherPanels('skinsPanel');
  } else {
    const shop = document.getElementById('shopPanel');
    if (shop) shop.classList.remove('active');
  }
  panel.classList.toggle('active', open);
  if (open) {
    currentSkinIndex = SKINS.findIndex(s => s.id === selectedSkinId);
    if (currentSkinIndex === -1) currentSkinIndex = 0;
    renderSkinsPanel();
  }
}

function nextSkin() {
  currentSkinIndex = (currentSkinIndex + 1) % SKINS.length;
  renderSkinsPanel();
}

function previousSkin() {
  currentSkinIndex = (currentSkinIndex - 1 + SKINS.length) % SKINS.length;
  renderSkinsPanel();
}

function selectCurrentSkin() {
  const skin = SKINS[currentSkinIndex];
  if (!skin) return;
  if (!skin.unlocked) {
    tryBuyCurrentSkin();
    return;
  }
  setSelectedSkin(skin.id);
  if (skin.id === CRASHIS_CONFUSED_SKIN_ID) unlockAchievement('typicooo');
  renderSkinsPanel();
}

function tryBuyCurrentSkin() {
  const skin = SKINS[currentSkinIndex];
  if (!skin || skin.unlocked) return;
  const price = skin.priceWallets || 0;
  if (wallets < price) {
    activeVoiceLine = `Potřebuješ ${price} Peněženky. Aeternum levně nedává.`;
    activeVoiceLineUntil = performance.now() + 2800;
    renderSkinsPanel();
    return;
  }
  wallets -= price;
  skin.unlocked = true;
  saveUnlockedSkins();
  saveEconomy();
  updateEconomyUi();
  handleSkinUnlocked(skin);
  renderSkinsPanel();
}

function handleSkinUnlocked(skin) {
  if (!skin) return;
  showUnlockToast('SKIN ODEMČEN', `${skin.name} je tvůj. Teď už aspoň vypadáš draze.`, 'skin');
  if (skin.id === CRASHIS_CONFUSED_SKIN_ID) unlockAchievement('typicooo');
}

function isSelectedSkin(id) {
  return selectedSkinId === id;
}

function applySelectedSkinEndGameEffects() {
  if (!isSelectedSkin(CRASHIS_SMAZENY_SKIN_ID)) return;
  if (Math.random() < 0.25) {
    const stolen = Math.min(2, yang);
    if (stolen > 0) {
      yang -= stolen;
      saveEconomy();
      updateEconomyUi();
      showUnlockToast(`-${stolen} Yangy`, 'Crashis Smažený ti sežral výplatu.', 'achievement');
    }
  }
}

function applySelectedSkinStartEffects() {
  if (!isSelectedSkin(MARTIN_SLUNECNY_SKIN_ID)) return;
  doubleYangUntil = performance.now() + MARTIN_SLUNECNY_BUFF_MS;
  showUnlockToast('SOLÁRNÍ START', 'Martin Slunečný zapnul dvojnásobné Yangy na 10 sekund.', 'wallet');
}

function renderSkinsPanel() {
  const skin = SKINS[currentSkinIndex];
  if (!skin) return;

  const nameEl = document.getElementById('skinPreviewName');
  const descEl = document.getElementById('skinPreviewDesc');
  const statusEl = document.getElementById('skinPreviewStatus');
  const selectBtn = document.getElementById('skinSelectBtn');
  const previewImg = document.getElementById('skinPreviewImg');
  let effectEl = document.getElementById('skinPreviewEffect');
  if (!effectEl && descEl && descEl.parentNode) {
    effectEl = document.createElement('div');
    effectEl.id = 'skinPreviewEffect';
    effectEl.className = 'skin-effect';
    descEl.parentNode.insertBefore(effectEl, descEl.nextSibling);
  }

  if (nameEl) nameEl.textContent = skin.name;
  if (descEl) descEl.textContent = skin.desc;
  if (effectEl) {
    if (skin.effectDescription) {
      effectEl.textContent = `Efekt: ${skin.effectDescription}`;
      effectEl.style.display = '';
    } else {
      effectEl.textContent = '';
      effectEl.style.display = 'none';
    }
  }

  if (previewImg) {
    const img = skinImages.get(skin.id);
    if (img && img.src) {
      previewImg.src = img.src;
      previewImg.style.display = 'block';
    } else {
      previewImg.src = headImg.src;
      previewImg.style.display = 'block';
    }
  }

  const price = skin.priceWallets || 0;
  if (!skin.unlocked) {
    const canAfford = wallets >= price;
    if (statusEl) statusEl.textContent = `🔒 ${price} Peněženky`;
    if (selectBtn) {
      if (canAfford) {
        selectBtn.textContent = `Koupit za ${price} Peněženky`;
        selectBtn.disabled = false;
        selectBtn.classList.remove('disabled');
      } else {
        selectBtn.textContent = 'Nedostatek Peněženek';
        selectBtn.disabled = true;
        selectBtn.classList.add('disabled');
      }
    }
  } else if (skin.id === selectedSkinId) {
    if (statusEl) statusEl.textContent = 'Vybráno';
    if (selectBtn) { selectBtn.textContent = 'Vybráno ✓'; selectBtn.disabled = true; selectBtn.classList.add('disabled'); }
  } else {
    if (statusEl) statusEl.textContent = 'Odemčeno';
    if (selectBtn) { selectBtn.textContent = 'Vybrat'; selectBtn.disabled = false; selectBtn.classList.remove('disabled'); }
  }
}
