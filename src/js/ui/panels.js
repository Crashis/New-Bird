const ALL_PANEL_IDS = [
  'shopPanel', 'skinsPanel', 'achievementsPanel', 'cheatCodesPanel',
  'settingsPanel', 'shellGamePanel', 'heirloomPanel',
  'tavernaPanel', 'threeChestsPanel', 'dragonDicePanel'
];

function closeOtherPanels(keepId) {
  for (const id of ALL_PANEL_IDS) {
    if (id === keepId) continue;
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  }
}
function closeAllPanels() { closeOtherPanels(null); }

function toggleShop(forceOpen) {
  const panel = document.getElementById('shopPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.shopBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('shopPanel');
  panel.classList.toggle('active', open);
  if (open) {
    showShopMessage('');
    updateEconomyUi();
  }
}

function toggleCheatCodesPanel(forceOpen) {
  const panel = document.getElementById('cheatCodesPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.cheatsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('cheatCodesPanel');
  panel.classList.toggle('active', open);
}

function toggleAchievementsPanel(forceOpen) {
  const panel = document.getElementById('achievementsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.achievementsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('achievementsPanel');
  panel.classList.toggle('active', open);
  if (open) renderAchievementsPanel();
}

function toggleSettingsPanel(forceOpen) {
  const panel = document.getElementById('settingsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.settingsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('settingsPanel');
  panel.classList.toggle('active', open);
  if (open) renderSettingsPanel();
}

function toggleHeirloomPanel(forceOpen) {
  const panel = document.getElementById('heirloomPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.heirloomBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('heirloomPanel');
  panel.classList.toggle('active', open);
  if (open && typeof renderHeirloomPanel === 'function') renderHeirloomPanel();
}

function toggleShellGamePanel(forceOpen) {
  const panel = document.getElementById('shellGamePanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('shellGamePanel');
  panel.classList.toggle('active', open);
  if (open && typeof renderShellGamePanel === 'function') renderShellGamePanel();
}

// ── Taverna ──────────────────────────────────────────────

function toggleTavernaPanel(forceOpen) {
  const panel = document.getElementById('tavernaPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('tavernaPanel');
  panel.classList.toggle('active', open);
}

function openTavernaGame(game) {
  closeAllPanels();
  if (game === 'shellGame') {
    toggleShellGamePanel(true);
  } else if (game === 'threeChests') {
    toggleThreeChestsPanel(true);
  } else if (game === 'dragonDice') {
    toggleDragonDicePanel(true);
  }
}

function backToTaverna() {
  closeAllPanels();
  toggleTavernaPanel(true);
}

// ── Tři truhly ───────────────────────────────────────────

function toggleThreeChestsPanel(forceOpen) {
  const panel = document.getElementById('threeChestsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('threeChestsPanel');
  panel.classList.toggle('active', open);
  if (open && typeof initThreeChests === 'function') initThreeChests();
}

// ── Dračí kostka ─────────────────────────────────────────

function toggleDragonDicePanel(forceOpen) {
  const panel = document.getElementById('dragonDicePanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('dragonDicePanel');
  panel.classList.toggle('active', open);
  if (open && typeof initDragonDice === 'function') initDragonDice();
}
