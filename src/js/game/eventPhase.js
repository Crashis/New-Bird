// ===== EVENT PHASE (Fáze 2 — po score 20 v endless) =====
function activateEventPhase() {
  if (eventPhaseActive) return;
  eventPhaseActive = true;
  currentGamePhase = GAME_PHASES.CORRUPTED;
  if (score >= EVENT_PHASE_TRIGGER_SCORE) unlockAchievement('survived_amazon');

  const overlay = document.getElementById('gameOverlay');
  if (overlay) {
    overlay.classList.remove('phase-frost', 'phase-void');
    overlay.classList.add('event-phase', 'phase-corrupted');
  }

  applyEventPhaseMusic();

  // Aktivační hláška (respektuje Voice toggle).
  if (settings.voiceLines) {
    activeVoiceLine = t('event.eventPhaseVoice');
    activeVoiceLineUntil = performance.now() + 4200;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(activeVoiceLine);
        utter.lang = window.NWI18n && window.NWI18n.getCurrentLanguage() === 'en' ? 'en-US' : 'cs-CZ';
        utter.rate = 0.92;
        utter.pitch = 0.55;
        utter.volume = 0.55;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }

  showEventPhaseToast();

  if (settings.effects) {
    triggerEventPhaseShake();
    triggerEventPhaseFlash();
    // Burst rudých částic pro pocit corrupted průlomu.
    for (let i = 0; i < 36; i++) {
      particles.push({
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: canvas.height * (0.15 + Math.random() * 0.55),
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 55 + Math.random() * 35,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#b8302a' : '#5a0a0a'
      });
    }
  }
}

function resetEventPhase() {
  eventPhaseActive = false;
  currentGamePhase = GAME_PHASES.NORMAL;
  score60PhaseActivated = false;
  dragonCoinAwardedThisRun = false;
  score100MilestoneShown = false;
  score200MilestoneShown = false;
  score500FinalShown = false;
  const overlay = document.getElementById('gameOverlay');
  if (overlay) {
    overlay.classList.remove('event-phase', 'phase-corrupted', 'phase-frost', 'phase-void', 'phase-green');
  }
  applyEventPhaseMusic();
}

// Score 200 — zelená fáze, vizuální změna (rychlost zůstává).
function activateGreenPhase() {
  currentGamePhase = GAME_PHASES.GREEN;
  const overlay = document.getElementById('gameOverlay');
  if (overlay) {
    overlay.classList.remove('event-phase', 'phase-corrupted', 'phase-frost', 'phase-void');
    overlay.classList.add('phase-green');
  }
  showPhaseToast(t('milestone.green.toast'));
  applyEventPhaseMusic();
}

function maybeActivateEventPhase() {
  if (!eventPhaseActive && endlessMode && score >= EVENT_PHASE_TRIGGER_SCORE) {
    activateEventPhase();
  }
}

// Score 60 — modrá fáze, bez modalu, jen vizuál.
function activateFrostPhase() {
  if (score60PhaseActivated) return;
  score60PhaseActivated = true;
  currentGamePhase = GAME_PHASES.FROST;
  const overlay = document.getElementById('gameOverlay');
  if (overlay) {
    overlay.classList.remove('event-phase', 'phase-corrupted', 'phase-void');
    overlay.classList.add('phase-frost');
  }
  showPhaseToast(t('milestone.frost.toast'));
  // +1 Dračí mince za dosažení fáze 3 (score 60+), jen jednou za run.
  if (!dragonCoinAwardedThisRun) {
    dragonCoinAwardedThisRun = true;
    if (typeof addDragonCoins === 'function') {
      const _dcMult = (typeof getGodiasWalletMultiplier === 'function') ? getGodiasWalletMultiplier() : 1;
      addDragonCoins(_dcMult);
    }
    if (typeof showUnlockToast === 'function') {
      showUnlockToast(t('toast.dragonCoinPhase3.title'), t('toast.dragonCoinPhase3.subtitle'), 'upgrade');
    }
  }
  // Score 60 = visual change only — music key derives to phase2 so this is a no-op
  // if phase2 is already running, but ensures continuity in edge cases.
  applyEventPhaseMusic();
}

function maybeActivateFrostPhase() {
  if (!score60PhaseActivated && score >= FROST_PHASE_TRIGGER_SCORE) {
    activateFrostPhase();
  }
}

// Score 100 — boss Bezos modal, po potvrzení fialová.
function activateVoidPhase() {
  currentGamePhase = GAME_PHASES.VOID;
  const overlay = document.getElementById('gameOverlay');
  if (overlay) {
    overlay.classList.remove('event-phase', 'phase-corrupted', 'phase-frost');
    overlay.classList.add('phase-void');
  }
  showPhaseToast(t('milestone.void.toast'));
  applyEventPhaseMusic();
}

function showPhaseToast(text) {
  const wrap = document.querySelector('.game-canvas-wrap');
  if (!wrap || !text) return;
  let toast = document.getElementById('eventPhaseToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'eventPhaseToast';
    toast.className = 'event-phase-toast';
    wrap.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 1900);
}

function showEventPhaseToast() {
  const wrap = document.querySelector('.game-canvas-wrap');
  if (!wrap) return;
  let toast = document.getElementById('eventPhaseToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'eventPhaseToast';
    toast.className = 'event-phase-toast';
    wrap.appendChild(toast);
  }
  toast.textContent = t('event.eventPhase');
  toast.classList.remove('show');
  // Force reflow so the animation re-triggers if activated repeatedly (debug).
  void toast.offsetWidth;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 1900);
}

function triggerEventPhaseFlash() {
  const wrap = document.querySelector('.game-canvas-wrap');
  if (!wrap) return;
  let flash = document.getElementById('eventPhaseFlash');
  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'eventPhaseFlash';
    flash.className = 'event-phase-flash';
    wrap.appendChild(flash);
  }
  flash.classList.remove('show');
  void flash.offsetWidth;
  flash.classList.add('show');
  setTimeout(() => flash.classList.remove('show'), 900);
}

function triggerEventPhaseShake() {
  const wrap = document.querySelector('.game-canvas-wrap');
  if (!wrap) return;
  wrap.classList.remove('event-shake');
  void wrap.offsetWidth;
  wrap.classList.add('event-shake');
  setTimeout(() => wrap.classList.remove('event-shake'), 600);
}
