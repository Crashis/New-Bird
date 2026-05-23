// Vzácný background easter egg: během runu občas (cca 12 %) proletí Godias
// pozadím a řekne hlášku. Resetuje se na začátku každého runu. Pouze vizuální —
// neinteraguje se gameplayem, kolizemi ani HUDem.

const GODIAS_APPEAR_CHANCE = 0.12;            // šance na run (~12 %)
const GODIAS_EARLIEST_MS   = 10000;           // nejdřív se objeví po 10 s
const GODIAS_LATEST_MS     = 35000;           // nejpozději do 35 s od startu runu
const GODIAS_FLY_DURATION_MS = 5200;          // jak dlouho letí přes obrazovku
const GODIAS_BUBBLE_DURATION_MS = 3200;       // jak dlouho je vidět bublina

let godiasEasterEggScheduled = false;         // bude se v tomto runu vůbec objevit?
let godiasEasterEggShownThisRun = false;      // už proletěl?
let godiasEasterEggStartAt = 0;               // performance.now() při startu letu
let godiasEasterEggScheduledAtRunStart = 0;   // ms od startu runu, kdy se má spustit
let godiasRunStartedAt = 0;

function resetGodiasEasterEgg() {
  godiasEasterEggShownThisRun = false;
  godiasEasterEggStartAt = 0;
  godiasRunStartedAt = performance.now();
  godiasEasterEggScheduled = Math.random() < GODIAS_APPEAR_CHANCE;
  if (godiasEasterEggScheduled) {
    const span = GODIAS_LATEST_MS - GODIAS_EARLIEST_MS;
    godiasEasterEggScheduledAtRunStart = GODIAS_EARLIEST_MS + Math.random() * span;
  } else {
    godiasEasterEggScheduledAtRunStart = 0;
  }
}

function maybeStartGodiasEasterEgg() {
  if (!godiasEasterEggScheduled) return;
  if (godiasEasterEggShownThisRun) return;
  if (godiasEasterEggStartAt > 0) return;
  if (typeof gameState !== 'undefined' && gameState !== 'playing') return;
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  const now = performance.now();
  if (now - godiasRunStartedAt < godiasEasterEggScheduledAtRunStart) return;
  godiasEasterEggStartAt = now;
  godiasEasterEggShownThisRun = true;
}

function drawGodiasFigure(cx, cy, scale) {
  // Stylový pixel-art Godias: zlatá peněženka s nohama. Drží se ve fantasy laďení.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  // Tělo (peněženka)
  ctx.fillStyle = '#caa040';
  ctx.fillRect(-24, -16, 48, 28);
  ctx.fillStyle = '#8a6a20';
  ctx.fillRect(-24, -16, 48, 4);
  ctx.fillStyle = '#3a2a0a';
  ctx.fillRect(-6, -4, 12, 6); // přezka
  // Oči
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(-14, -8, 4, 4);
  ctx.fillRect(10, -8, 4, 4);
  // Nohy
  ctx.fillStyle = '#3a2a10';
  ctx.fillRect(-14, 12, 6, 8);
  ctx.fillRect(8, 12, 6, 8);
  // Glow (jen pokud zapnuté efekty)
  if (typeof settings !== 'undefined' && settings && settings.effects && !window.PERF_MOBILE) {
    ctx.shadowColor = '#fff2a8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(255,242,168,0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-24, -16, 48, 28);
  }
  ctx.restore();
}

function drawGodiasSpeechBubble(x, y, text) {
  ctx.save();
  ctx.font = 'bold 16px "Cinzel", serif';
  const padX = 12;
  const padY = 8;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 28;
  const bx = x - w / 2;
  const by = y - h - 12;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(20,12,4,0.85)';
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(bx, by, w, h, 8);
  } else {
    ctx.rect(bx, by, w, h);
  }
  ctx.fill();
  ctx.stroke();
  // ocásek bubliny
  ctx.beginPath();
  ctx.moveTo(x - 6, by + h);
  ctx.lineTo(x + 6, by + h);
  ctx.lineTo(x, by + h + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // text
  ctx.fillStyle = '#f0d080';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + h / 2);
  ctx.restore();
}

function updateAndDrawGodiasEasterEgg() {
  if (typeof gameState !== 'undefined' && gameState !== 'playing') return;
  if (typeof ctx === 'undefined' || typeof canvas === 'undefined') return;
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;

  maybeStartGodiasEasterEgg();
  if (godiasEasterEggStartAt <= 0) return;

  const elapsed = performance.now() - godiasEasterEggStartAt;
  if (elapsed > GODIAS_FLY_DURATION_MS) return;

  const t01 = elapsed / GODIAS_FLY_DURATION_MS;
  // Letí zprava doleva, vysoko nad hráčem (cca čtvrtina obrazovky shora),
  // aby nepřekrýval HUD ani spodní ovládací prvky na mobilu.
  const startX = canvas.width + 80;
  const endX = -120;
  const x = startX + (endX - startX) * t01;
  // jemné houpání vertikálně
  const baseY = canvas.height * 0.28;
  const y = baseY + Math.sin(elapsed / 320) * 12;

  // Vykresli postavu (na pozadí — voláno hned po drawBackground).
  drawGodiasFigure(x, y, 1);

  // Bublina s hláškou je vidět jen první ~3 s letu.
  if (elapsed < GODIAS_BUBBLE_DURATION_MS) {
    const line = (typeof t === 'function') ? t('godias.easterEgg.line') : 'zipuje se, zipuje se';
    drawGodiasSpeechBubble(x, y - 28, line);
  }
}
