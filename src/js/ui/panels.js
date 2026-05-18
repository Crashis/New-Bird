const ALL_PANEL_IDS = [
  'shopPanel', 'skinsPanel', 'achievementsPanel', 'cheatCodesPanel',
  'settingsPanel', 'shellGamePanel', 'heirloomPanel',
  'tavernaPanel', 'threeChestsPanel', 'dragonDicePanel',
  'drunkArcherPanel', 'battlepassPanel', 'upgradesPanel',
  'pirateMapPanel', 'dragonEggPanel', 'blacksmithPanel', 'wheelOfFortunePanel',
  'dungeonsPanel', 'leaderboardPanel', 'creditsPanel'
];

function toggleCreditsPanel(forceOpen) {
  const panel = document.getElementById('creditsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.settingsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('creditsPanel');
  panel.classList.toggle('active', open);
}

function showCreditsSupport() {
  const msg = (typeof t === 'function') ? t('credits.support.msg') : 'Haaa, tady tě nikdo nepodpoří!!!';
  if (typeof showUnlockToast === 'function') {
    showUnlockToast('💸 Support', msg, 'achievement');
  } else {
    alert(msg);
  }
}

function toggleUpgradesPanel(forceOpen) {
  const panel = document.getElementById('upgradesPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.upgradesBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('upgradesPanel');
  panel.classList.toggle('active', open);
  if (open) {
    if (typeof showUpgradesMessage === 'function') showUpgradesMessage('');
    if (typeof renderUpgradesPanel === 'function') renderUpgradesPanel();
  }
}

function closeOtherPanels(keepId) {
  for (const id of ALL_PANEL_IDS) {
    if (id === keepId) continue;
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      if (id === 'drunkArcherPanel' && typeof stopDrunkArcherAnimation === 'function') {
        stopDrunkArcherAnimation();
      }
      if (id === 'blacksmithPanel' && typeof stopBlacksmithAnimation === 'function') {
        stopBlacksmithAnimation();
      }
      if (id === 'wheelOfFortunePanel' && typeof stopWheelAnimation === 'function') {
        stopWheelAnimation();
      }
    }
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
  } else if (game === 'drunkArcher') {
    toggleDrunkArcherPanel(true);
  } else if (game === 'pirateMap') {
    togglePirateMapPanel(true);
  } else if (game === 'dragonEgg') {
    toggleDragonEggPanel(true);
  } else if (game === 'blacksmith') {
    toggleBlacksmithPanel(true);
  } else if (game === 'wheelOfFortune') {
    toggleWheelOfFortunePanel(true);
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

// ── Battlepass ───────────────────────────────────────────

function toggleBattlepassPanel(forceOpen) {
  const panel = document.getElementById('battlepassPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.shopBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('battlepassPanel');
  panel.classList.toggle('active', open);
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

// ── Opilý lukostřelec ─────────────────────────────────────

function toggleDrunkArcherPanel(forceOpen) {
  const panel = document.getElementById('drunkArcherPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('drunkArcherPanel');
  panel.classList.toggle('active', open);
  if (!open && typeof stopDrunkArcherAnimation === 'function') stopDrunkArcherAnimation();
  if (open && typeof initDrunkArcher === 'function') initDrunkArcher();
}

// ── Pirátská mapa ────────────────────────────────────────

function togglePirateMapPanel(forceOpen) {
  const panel = document.getElementById('pirateMapPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('pirateMapPanel');
  panel.classList.toggle('active', open);
  if (open && typeof initPirateMap === 'function') initPirateMap();
}

// ── Dračí vejce ──────────────────────────────────────────

function toggleDragonEggPanel(forceOpen) {
  const panel = document.getElementById('dragonEggPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('dragonEggPanel');
  panel.classList.toggle('active', open);
  if (open && typeof initDragonEgg === 'function') initDragonEgg();
}

// ── Kovářova výzva ───────────────────────────────────────

function toggleBlacksmithPanel(forceOpen) {
  const panel = document.getElementById('blacksmithPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('blacksmithPanel');
  panel.classList.toggle('active', open);
  if (!open && typeof stopBlacksmithAnimation === 'function') stopBlacksmithAnimation();
  if (open && typeof initBlacksmith === 'function') initBlacksmith();
}

// ── Kolo štěstí ──────────────────────────────────────────

// ── Dungeons ─────────────────────────────────────────────

function renderDungeonsPanel() {
  const unlocked = (typeof isBezosBossTicketUnlocked === 'function') && isBezosBossTicketUnlocked();
  const wonToday = (typeof wasBezosBossWonToday === 'function') && wasBezosBossWonToday();
  const startBtn = document.getElementById('dungeonBezosStartBtn');
  const statusEl = document.getElementById('dungeonBezosStatus');
  const hintEl = document.getElementById('dungeonBezosHint');
  if (startBtn) startBtn.disabled = !unlocked || wonToday;
  if (statusEl) statusEl.textContent = !unlocked ? '🔒' : (wonToday ? '⏳' : '🎫');
  if (hintEl) {
    let key;
    if (!unlocked) key = 'dungeons.bezos.lockedHint';
    else if (wonToday) key = 'dungeons.bezos.cooldownHint';
    else key = 'dungeons.bezos.availableHint';
    hintEl.textContent = t(key);
  }
}

function toggleDungeonsPanel(forceOpen) {
  const panel = document.getElementById('dungeonsPanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.settingsBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('dungeonsPanel');
  panel.classList.toggle('active', open);
  if (open) renderDungeonsPanel();
}

function toggleWheelOfFortunePanel(forceOpen) {
  const panel = document.getElementById('wheelOfFortunePanel');
  if (!panel) return;
  const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
  if (open && gameState === 'playing') {
    activeVoiceLine = t('panel.tavernaBlocked');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  closeOtherPanels('wheelOfFortunePanel');
  panel.classList.toggle('active', open);
  if (!open && typeof stopWheelAnimation === 'function') stopWheelAnimation();
  if (open && typeof initWheelOfFortune === 'function') initWheelOfFortune();
}

function initCloudSavePanel() {
  if (typeof document === 'undefined') return;
  const statusEl = document.getElementById('cloudSaveStatusText');
  const uploadBtn = document.getElementById('cloudSaveUploadBtn');
  const downloadBtn = document.getElementById('cloudSaveDownloadBtn');
  const migrateBtn = document.getElementById('cloudSaveRunMigrationBtn');
  if (!statusEl) return;

  function statusLabel(status) {
    switch (status) {
      case 'disabled': return 'Cloud save: vypnuto';
      case 'ready': return 'Cloud save: připraveno';
      case 'saving': return 'Cloud save: ukládá se...';
      case 'synced': return 'Cloud save: synchronizováno';
      case 'error': return 'Cloud save: chyba — hraješ lokálně';
      case 'idle': return 'Cloud save: čeká na inicializaci';
      default: return 'Cloud save: ' + (status || 'neznámý stav');
    }
  }

  function refresh() {
    if (window.NWCloudSave && typeof window.NWCloudSave.getCloudSaveStatus === 'function') {
      const { status } = window.NWCloudSave.getCloudSaveStatus();
      statusEl.textContent = statusLabel(status);
      const enabled = status !== 'disabled' && status !== 'idle';
      if (uploadBtn) uploadBtn.disabled = !enabled;
      if (downloadBtn) downloadBtn.disabled = !enabled;
    } else {
      statusEl.textContent = statusLabel('disabled');
      if (uploadBtn) uploadBtn.disabled = true;
      if (downloadBtn) downloadBtn.disabled = true;
    }
  }

  refresh();
  let unsub = null;
  function trySubscribe() {
    if (unsub) return;
    if (window.NWCloudSave && typeof window.NWCloudSave.subscribeCloudSaveStatus === 'function') {
      unsub = window.NWCloudSave.subscribeCloudSaveStatus(refresh);
    }
  }
  trySubscribe();
  // NWCloudSave is created when cloudSave.js ESM module loads asynchronously
  // after Firebase auth. Retry subscription a few times until it appears.
  let attempts = 0;
  const retry = setInterval(() => {
    attempts += 1;
    refresh();
    trySubscribe();
    if (unsub || attempts >= 30) clearInterval(retry);
  }, 1000);

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      if (!window.NWCloudSave || typeof window.NWCloudSave.uploadLocalProgressToCloud !== 'function') return;
      uploadBtn.disabled = true;
      try {
        await window.NWCloudSave.uploadLocalProgressToCloud('manual-upload');
      } finally {
        uploadBtn.disabled = false;
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      if (!window.NWCloudSave || typeof window.NWCloudSave.downloadCloudProgressToLocal !== 'function') return;
      const ok = window.confirm('Tím přepíšeš lokální progress cloudovým. Pokračovat?');
      if (!ok) return;
      downloadBtn.disabled = true;
      try {
        const success = await window.NWCloudSave.downloadCloudProgressToLocal();
        if (success) window.location.reload();
      } finally {
        downloadBtn.disabled = false;
      }
    });
  }

  if (migrateBtn) {
    migrateBtn.addEventListener('click', () => {
      if (window.NWCloudMigration && typeof window.NWCloudMigration.clearMigrationDismissed === 'function') {
        window.NWCloudMigration.clearMigrationDismissed();
      }
      window.location.reload();
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSavePanel);
  } else {
    initCloudSavePanel();
  }
}
