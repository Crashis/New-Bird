// ===== MOON LEVEL =====
// Speciální bonusový dungeon. Vstup pouze přes vstupenku (1 vstupenka = 1 pokus).
// Vstupenka se odečte při startu — bez ohledu na výsledek runu.
// Po dobu runu se všechny získané měny násobí 3× a yang má lehce vyšší spawn rate.
// Hudba: assets/audio/moon.mp3 (single track po celou dobu runu).
//
// Mode-flag: currentGameMode === 'moonLevel'. Multiplier i mode se po skončení
// runu vrací do normálu přes resetMoonLevelModeIfActive(), které volají
// gameLoop.endGame / winGame / openGame / returnToMainMenu.

const MOON_LEVEL_CURRENCY_MULTIPLIER = 3;
const MOON_LEVEL_YANG_SPAWN_BONUS = 0.07; // ~+30 % proti YANG_CHANCE (0.22)

function isMoonLevelActive() {
  return typeof currentGameMode !== 'undefined' && currentGameMode === 'moonLevel';
}

function getRunCurrencyMultiplier() {
  return isMoonLevelActive() ? MOON_LEVEL_CURRENCY_MULTIPLIER : 1;
}

function getMoonLevelYangSpawnBonus() {
  return isMoonLevelActive() ? MOON_LEVEL_YANG_SPAWN_BONUS : 0;
}

function getMoonLevelPhaseColor(score) {
  if (score >= 500) return '#333333';
  if (score >= 100) return '#555555';
  if (score >= 60)  return '#777777';
  if (score >= 20)  return '#9a9a9a';
  return '#b8b8b8';
}

function drawMoonBackground() {
  const base = getMoonLevelPhaseColor(typeof score === 'number' ? score : 0);
  // Lehce ztmavený gradient s šedavou paletou.
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, base);
  grad.addColorStop(0.5, shadeMoonColor(base, -25));
  grad.addColorStop(1, shadeMoonColor(base, -50));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tmavé měsíční hory (parallax) — místo gold tónů použijeme šedou.
  ctx.fillStyle = shadeMoonColor(base, -60);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 80);
  const offset = (frameCount * 0.3) % canvas.width;
  for (let i = 0; i < canvas.width + 100; i += 40) {
    const h = 40 + Math.sin((i + offset) * 0.05) * 25 + Math.sin((i + offset) * 0.12) * 15;
    ctx.lineTo(i - offset, canvas.height - 60 - h);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = shadeMoonColor(base, -75);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 40);
  const offset2 = (frameCount * 0.6) % canvas.width;
  for (let i = 0; i < canvas.width + 100; i += 30) {
    const h = 25 + Math.sin((i + offset2) * 0.08) * 18 + Math.sin((i + offset2) * 0.2) * 8;
    ctx.lineTo(i - offset2, canvas.height - 40 - h);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  // Pár hvězd / prachu (vypnuto v perf mobile).
  if (!window.PERF_MOBILE) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 18; i++) {
      const x = ((i * 73 + frameCount * 0.5) % canvas.width);
      const y = ((i * 47 + frameCount * 0.8) % canvas.height);
      const s = (i % 3) * 0.5 + 0.5;
      ctx.fillRect(x, y, s, s);
    }
  }

  // Ground
  ctx.fillStyle = shadeMoonColor(base, -80);
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  ctx.fillStyle = shadeMoonColor(base, -65);
  ctx.fillRect(0, canvas.height - 20, canvas.width, 2);
}

function shadeMoonColor(hex, delta) {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return hex;
  const clamp = v => Math.max(0, Math.min(255, v));
  const r = clamp(parseInt(m[1], 16) + delta);
  const g = clamp(parseInt(m[2], 16) + delta);
  const b = clamp(parseInt(m[3], 16) + delta);
  const toHex = v => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function canStartMoonLevel() {
  return (typeof getMoonTickets === 'function') && getMoonTickets() > 0;
}

function startMoonLevel() {
  if (!canStartMoonLevel()) {
    activeVoiceLine = t('moonLevel.noTicket');
    activeVoiceLineUntil = performance.now() + 2800;
    return;
  }
  if (gameState === 'playing') return;
  // Odečti ticket okamžitě — bez ohledu na výsledek runu.
  if (typeof spendMoonTicket === 'function' && !spendMoonTicket()) return;

  currentGameMode = 'moonLevel';
  if (typeof closeAllPanels === 'function') closeAllPanels();
  const startPanel = document.getElementById('startPanel');
  if (startPanel) startPanel.classList.add('hidden');
  const overlayEl = document.getElementById('gameOverlay');
  if (overlayEl) overlayEl.classList.remove('menu-open');
  document.body.classList.remove('modal-open');

  // Uvítací hláška na canvasu.
  showUnlockToast(t('moonLevel.welcomeTitle'), t('moonLevel.welcomeSub'), 'wallet');

  // Použij standardní countdown + startGameNow flow — gameLoop si vyrendruje
  // moon background a applyPowerup si vyzvedne multiplier sám.
  startGameCountdown();
}

// Pokud aktivně běží moon level, vrať stav do normálu (mode + případné UI).
// Volá se z endGame / winGame / openGame / returnToMainMenu.
function resetMoonLevelModeIfActive() {
  if (!isMoonLevelActive()) return;
  currentGameMode = 'normal';
}
