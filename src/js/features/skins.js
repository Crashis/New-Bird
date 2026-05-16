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
    activeVoiceLine = t('panel.skinsBlocked');
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
    activeVoiceLine = t('skins.notEnoughMsg', { price });
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
  const skinTrans = window.NWI18n ? window.NWI18n.getSkinTranslation(skin.id) : null;
  const displayName = skinTrans && skinTrans.name ? skinTrans.name : skin.name;
  showUnlockToast(t('toast.skinUnlocked'), t('skins.unlockedToast', { name: displayName }), 'skin');
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
      showUnlockToast(`-${stolen} Yangy`, t('toast.crashisYangLost'), 'achievement');
    }
  }
}

function applySelectedSkinStartEffects() {
  if (!isSelectedSkin(MARTIN_SLUNECNY_SKIN_ID)) return;
  doubleYangUntil = performance.now() + MARTIN_SLUNECNY_BUFF_MS;
  showUnlockToast(t('toast.solarStart'), t('toast.solarSub'), 'wallet');
}

function renderSkinsPanel() {
  const skin = SKINS[currentSkinIndex];
  if (!skin) return;

  const skinTrans = window.NWI18n ? window.NWI18n.getSkinTranslation(skin.id) : null;
  const displayName = skinTrans && skinTrans.name ? skinTrans.name : skin.name;
  const displayDesc = skinTrans && skinTrans.desc ? skinTrans.desc : skin.desc;
  const displayEffect = skinTrans && skinTrans.effect ? skinTrans.effect : skin.effectDescription;
  const displayBuff = skinTrans && skinTrans.buff ? skinTrans.buff : skin.buffText;
  const displayDebuff = skinTrans && skinTrans.debuff ? skinTrans.debuff : skin.debuffText;

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
  let buffDebuffEl = document.getElementById('skinPreviewBuffDebuff');
  if (!buffDebuffEl && descEl && descEl.parentNode) {
    buffDebuffEl = document.createElement('div');
    buffDebuffEl.id = 'skinPreviewBuffDebuff';
    buffDebuffEl.className = 'skin-buff-debuff';
    const refNode = effectEl ? effectEl.nextSibling : descEl.nextSibling;
    descEl.parentNode.insertBefore(buffDebuffEl, refNode);
  }

  if (nameEl) nameEl.textContent = displayName;
  if (descEl) descEl.textContent = displayDesc;
  if (effectEl) {
    if (displayEffect) {
      effectEl.textContent = t('skins.effect', { text: displayEffect });
      effectEl.style.display = '';
    } else {
      effectEl.textContent = '';
      effectEl.style.display = 'none';
    }
  }
  if (buffDebuffEl) {
    if (displayBuff || displayDebuff) {
      buffDebuffEl.innerHTML = '';
      if (displayBuff) {
        const b = document.createElement('span');
        b.className = 'skin-buff';
        b.textContent = t('skins.buff', { text: displayBuff });
        buffDebuffEl.appendChild(b);
      }
      if (displayDebuff) {
        const d = document.createElement('span');
        d.className = 'skin-debuff';
        d.textContent = t('skins.debuff', { text: displayDebuff });
        buffDebuffEl.appendChild(d);
      }
      buffDebuffEl.style.display = '';
    } else {
      buffDebuffEl.innerHTML = '';
      buffDebuffEl.style.display = 'none';
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
    if (statusEl) statusEl.textContent = t('skins.locked', { price });
    if (selectBtn) {
      if (canAfford) {
        selectBtn.textContent = t('skins.buy', { price });
        selectBtn.disabled = false;
        selectBtn.classList.remove('disabled');
      } else {
        selectBtn.textContent = t('skins.notEnough');
        selectBtn.disabled = true;
        selectBtn.classList.add('disabled');
      }
    }
  } else if (skin.id === selectedSkinId) {
    if (statusEl) statusEl.textContent = t('skins.statusSelected');
    if (selectBtn) { selectBtn.textContent = t('skins.selected'); selectBtn.disabled = true; selectBtn.classList.add('disabled'); }
  } else {
    if (statusEl) statusEl.textContent = t('skins.statusUnlocked');
    if (selectBtn) { selectBtn.textContent = t('skins.select'); selectBtn.disabled = false; selectBtn.classList.remove('disabled'); }
  }
}
