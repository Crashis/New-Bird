// Heirloom — universal rocket launcher. Equippable from the Heirloom panel,
// shared by every skin. Right-click fires; 1 ammo per run; refills once at score 100.

const HEIRLOOM_ROCKET_KEY = 'heirloomRocketEquipped';

let heirloomRocketEquipped = true;
try {
  const stored = localStorage.getItem(HEIRLOOM_ROCKET_KEY);
  if (stored === '0') heirloomRocketEquipped = false;
  else if (stored === '1') heirloomRocketEquipped = true;
} catch (e) {}

let rocketAmmo = 1;
let rocketAmmoRestoredAt100 = false;
let rockets = [];
let rocketExplosions = [];

function isRocketLauncherEquipped() {
  return heirloomRocketEquipped === true;
}

function saveHeirloomRocketEquipped() {
  try { localStorage.setItem(HEIRLOOM_ROCKET_KEY, heirloomRocketEquipped ? '1' : '0'); } catch (e) {}
}

function resetRocketRunState() {
  rocketAmmo = isRocketLauncherEquipped() ? 1 : 0;
  rocketAmmoRestoredAt100 = false;
  rockets = [];
  rocketExplosions = [];
}

function maybeRefreshRocketAmmoAtScore() {
  if (!isRocketLauncherEquipped()) return;
  if (rocketAmmoRestoredAt100) return;
  if (typeof score !== 'number' || score < 100) return;
  rocketAmmoRestoredAt100 = true;
  if (rocketAmmo < 1) rocketAmmo = 1;
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('toast.rocketRestored.title'), t('toast.rocketRestored.subtitle'), 'upgrade');
  }
}

function fireRocket() {
  if (gameState !== 'playing') return;
  if (!isRocketLauncherEquipped()) return;
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  if (rocketAmmo <= 0) {
    activeVoiceLine = t('toast.noRocketAmmo.subtitle');
    activeVoiceLineUntil = performance.now() + 1800;
    return;
  }
  rocketAmmo--;

  // Pick the first obstacle whose right edge is still ahead of the player.
  let target = null;
  for (const p of pipes) {
    if (p.destroyed) continue;
    if (p.x + PIPE_WIDTH > player.x) {
      if (!target || p.x < target.x) target = p;
    }
  }

  rockets.push({
    x: player.x + player.r,
    y: player.y,
    vx: 28,
    radius: 7,
    target: target,
    active: true
  });
}

function destroyPipeFromRocket(pipe) {
  if (!pipe || pipe.destroyed) return;
  pipe.destroyed = true;
  // Mark passed so score logic ignores it; we don't award score for destroyed pipes.
  pipe.passed = true;
  // Strip pickups so they don't render or get collected through nothing.
  if (pipe.coin) pipe.coin.collected = true;
  if (pipe.yang) pipe.yang.collected = true;
  // Explosion effect at the gap center.
  const ex = pipe.x + PIPE_WIDTH / 2;
  const ey = pipe.gapTop + pipe.gap / 2;
  rocketExplosions.push({ x: ex, y: ey, age: 0, maxAge: 14 });
  if (settings && settings.effects && !window.PERF_MOBILE) {
    for (let i = 0; i < 22; i++) {
      particles.push({
        x: ex,
        y: ey,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        life: 32 + Math.random() * 18,
        size: 2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#ff9a3c' : '#f0d080'
      });
    }
  }
}

function updateRockets() {
  if (!rockets.length && !rocketExplosions.length) return;
  for (const r of rockets) {
    if (!r.active) continue;
    r.x += r.vx;
    // If target gone (e.g. scrolled off, or destroyed by something else), pick a new one.
    if (r.target && r.target.destroyed) r.target = null;
    if (!r.target) {
      for (const p of pipes) {
        if (p.destroyed) continue;
        if (p.x + PIPE_WIDTH > r.x - 4) { r.target = p; break; }
      }
    }
    if (r.target && r.x >= r.target.x) {
      destroyPipeFromRocket(r.target);
      r.active = false;
      continue;
    }
    if (r.x > canvas.width + 40) r.active = false;
  }
  rockets = rockets.filter(r => r.active);
  for (const ex of rocketExplosions) ex.age++;
  rocketExplosions = rocketExplosions.filter(ex => ex.age < ex.maxAge);
}

function drawRockets() {
  const perf = window.PERF_MOBILE;
  for (const r of rockets) {
    ctx.save();
    // Trail
    if (!perf && settings.effects) {
      ctx.fillStyle = 'rgba(255,160,80,0.45)';
      for (let i = 1; i <= 4; i++) {
        const tx = r.x - i * 8;
        ctx.beginPath();
        ctx.arc(tx, r.y, Math.max(1, r.radius - i * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Body
    ctx.fillStyle = '#3a2418';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0d080';
    ctx.fillRect(r.x - 4, r.y - 2, 8, 4);
    ctx.fillStyle = '#ff5040';
    ctx.beginPath();
    ctx.arc(r.x + r.radius, r.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const ex of rocketExplosions) {
    const t01 = ex.age / ex.maxAge;
    const radius = 8 + t01 * 38;
    ctx.save();
    ctx.globalAlpha = 1 - t01;
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (!perf && settings.effects) {
      ctx.globalAlpha = (1 - t01) * 0.6;
      ctx.fillStyle = '#f0d080';
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawRocketLauncher() {
  if (!isRocketLauncherEquipped()) return;
  // Small launcher visual attached to the player (offset bottom-right).
  // Drawn in world space (not rotated with the player) and outside the player hitbox.
  const px = player.x + player.r * 0.4;
  const py = player.y + player.r * 0.55;
  ctx.save();
  // Tube
  ctx.fillStyle = '#2a1f10';
  ctx.fillRect(px, py, 22, 7);
  ctx.fillStyle = '#3a2e1a';
  ctx.fillRect(px, py + 5, 22, 2);
  // Gold trim
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(px, py, 22, 1);
  ctx.fillRect(px + 2, py + 7, 18, 1);
  // Muzzle
  ctx.fillStyle = '#1a1208';
  ctx.fillRect(px + 22, py - 1, 3, 9);
  // Sight detail
  ctx.fillStyle = rocketAmmo > 0 ? '#ff5040' : '#80c8ff';
  ctx.fillRect(px + 8, py - 2, 3, 2);
  ctx.restore();
}

function drawRocketHud() {
  if (!isRocketLauncherEquipped()) return;
  if (gameState !== 'playing') return;
  const perf = window.PERF_MOBILE;
  ctx.save();
  ctx.font = 'bold 17px "Cinzel", serif';
  ctx.fillStyle = rocketAmmo > 0 ? '#f0d080' : '#80c8ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!perf) ctx.shadowBlur = 8;
  ctx.fillText(`🚀 ${t('hud.rocket')}: ${rocketAmmo}`, 18, 18);
  ctx.restore();
}

function toggleHeirloomRocketEquipped() {
  heirloomRocketEquipped = !heirloomRocketEquipped;
  saveHeirloomRocketEquipped();
  if (!heirloomRocketEquipped) {
    rockets = [];
    rocketAmmo = 0;
  } else if (gameState === 'playing' && rocketAmmo < 1 && !rocketAmmoRestoredAt100) {
    // Re-equip mid-run before milestone gives back the starting ammo.
    rocketAmmo = 1;
  }
  renderHeirloomPanel();
}

function renderHeirloomPanel() {
  const statusEl = document.getElementById('heirloomRocketStatus');
  const btnEl = document.getElementById('toggleHeirloomRocketBtn');
  if (statusEl) statusEl.textContent = heirloomRocketEquipped ? t('heirloom.rocket.equipped') : t('heirloom.rocket.unequipped');
  if (btnEl) btnEl.textContent = heirloomRocketEquipped ? t('heirloom.rocket.unequipAction') : t('heirloom.rocket.equipAction');
}
