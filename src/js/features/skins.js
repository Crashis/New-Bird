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
  if (!skin || !skin.unlocked) return;
  setSelectedSkin(skin.id);
  if (skin.id === CRASHIS_CONFUSED_SKIN_ID) unlockAchievement('typicooo');
  // TODO: If skins become purchasable later, call handleSkinUnlocked(skin)
  // only in the successful purchase/unlock branch, not when opening this panel.
  renderSkinsPanel();
}

function handleSkinUnlocked(skin) {
  if (!skin) return;
  showUnlockToast('SKIN ODEMČEN', 'Teď už aspoň vypadáš draze.', 'skin');
  if (skin.id === CRASHIS_CONFUSED_SKIN_ID) unlockAchievement('typicooo');
}

function renderSkinsPanel() {
  const skin = SKINS[currentSkinIndex];
  if (!skin) return;

  const nameEl = document.getElementById('skinPreviewName');
  const descEl = document.getElementById('skinPreviewDesc');
  const statusEl = document.getElementById('skinPreviewStatus');
  const selectBtn = document.getElementById('skinSelectBtn');
  const previewImg = document.getElementById('skinPreviewImg');

  if (nameEl) nameEl.textContent = skin.name;
  if (descEl) descEl.textContent = skin.desc;

  if (previewImg) {
    const img = skinImages.get(skin.id);
    if (img && img.complete && img.naturalWidth > 0) {
      previewImg.src = img.src;
      previewImg.style.display = 'block';
    } else if (img && img.src) {
      previewImg.src = img.src;
      previewImg.style.display = 'block';
    } else {
      previewImg.src = headImg.src;
      previewImg.style.display = 'block';
    }
  }

  if (!skin.unlocked) {
    if (statusEl) statusEl.textContent = '🔒 Zamčeno';
    if (selectBtn) { selectBtn.textContent = 'Zamčeno'; selectBtn.disabled = true; selectBtn.classList.add('disabled'); }
  } else if (skin.id === selectedSkinId) {
    if (statusEl) statusEl.textContent = '';
    if (selectBtn) { selectBtn.textContent = 'Vybráno ✓'; selectBtn.disabled = true; selectBtn.classList.add('disabled'); }
  } else {
    if (statusEl) statusEl.textContent = '';
    if (selectBtn) { selectBtn.textContent = 'Vybrat'; selectBtn.disabled = false; selectBtn.classList.remove('disabled'); }
  }
}
