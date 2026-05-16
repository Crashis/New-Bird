// ===== EVENT PHASE (Fáze 2 — po score 20 v endless) =====
function activateEventPhase() {
  if (eventPhaseActive) return;
  eventPhaseActive = true;
  if (score >= EVENT_PHASE_TRIGGER_SCORE) unlockAchievement('survived_amazon');

  const overlay = document.getElementById('gameOverlay');
  if (overlay) overlay.classList.add('event-phase');

  applyEventPhaseMusic();

  // Aktivační hláška (respektuje Voice toggle).
  if (settings.voiceLines) {
    activeVoiceLine = 'Fáze 2: už žádné slitování.';
    activeVoiceLineUntil = performance.now() + 4200;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(activeVoiceLine);
        utter.lang = 'cs-CZ';
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
  if (!eventPhaseActive) {
    // Pojistka: odstraň class i tak, kdyby zůstala z dřívějška.
    const overlay = document.getElementById('gameOverlay');
    if (overlay) overlay.classList.remove('event-phase');
    applyEventPhaseMusic();
    return;
  }
  eventPhaseActive = false;
  const overlay = document.getElementById('gameOverlay');
  if (overlay) overlay.classList.remove('event-phase');
  applyEventPhaseMusic();
}

function maybeActivateEventPhase() {
  if (!eventPhaseActive && endlessMode && score >= EVENT_PHASE_TRIGGER_SCORE) {
    activateEventPhase();
  }
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
  toast.textContent = 'FÁZE 2 AKTIVOVÁNA';
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
