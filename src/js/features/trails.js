// ===== TRAILS — runtime logika + particle systém =====

const trailParticles = []; // {x, y, vx, vy, life, maxLife, size, color, kind}

function getTrailById(id) {
  return TRAILS.find(t => t.id === id) || null;
}

function getOwnedTrails() {
  return TRAILS.filter(t => t.unlocked).map(t => t.id);
}

function canAffordTrail(trail) {
  if (!trail) return false;
  const c = trail.cost || {};
  if ((c.yang || 0) > yang) return false;
  if ((c.wallets || 0) > wallets) return false;
  if ((c.dragonCoins || 0) > dragonCoins) return false;
  if ((c.errCubes || 0) > errCubes) return false;
  return true;
}

function buyTrail(id) {
  const trail = getTrailById(id);
  if (!trail || trail.unlocked) return false;
  if (!canAffordTrail(trail)) {
    activeVoiceLine = 'Nemáš dost surovin.';
    activeVoiceLineUntil = performance.now() + 2200;
    return false;
  }
  const c = trail.cost || {};
  yang -= (c.yang || 0);
  wallets -= (c.wallets || 0);
  if (c.dragonCoins) spendDragonCoins(c.dragonCoins);
  errCubes -= (c.errCubes || 0);
  trail.unlocked = true;
  saveUnlockedTrails();
  saveEconomy();
  saveErrCubes();
  updateEconomyUi();
  showUnlockToast('Trail odemčen', trail.name, 'skin');
  return true;
}

function equipTrail(id) {
  const trail = getTrailById(id);
  if (!trail || !trail.unlocked) return false;
  selectedTrailId = id;
  saveSelectedTrail();
  return true;
}

function unequipTrail() {
  selectedTrailId = null;
  saveSelectedTrail();
  return true;
}

function setTrailColor(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  selectedTrailColor = hex;
  saveSelectedTrail();
  return true;
}

function getActiveTrail() {
  if (!selectedTrailId) return null;
  const t = getTrailById(selectedTrailId);
  return (t && t.unlocked) ? t : null;
}

function spawnTrailParticleAt(px, py) {
  const trail = getActiveTrail();
  if (!trail) return;
  // Mezera za hráčem: vznik o `player.r + offset` doleva (game scrolluje doprava),
  // efekt nezasahuje do hitboxu.
  const offset = 6;
  const baseX = px - (player.r + offset);
  const baseY = py + (Math.random() - 0.5) * 6;

  if (trail.type === 'glow') {
    trailParticles.push({
      x: baseX,
      y: baseY,
      vx: -0.6 - Math.random() * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: 32,
      maxLife: 32,
      size: 6 + Math.random() * 3,
      color: selectedTrailColor,
      kind: 'glow'
    });
  } else if (trail.type === 'fire') {
    trailParticles.push({
      x: baseX,
      y: baseY - 2,
      vx: -0.4 - Math.random() * 0.5,
      vy: -0.3 - Math.random() * 0.5,
      life: 26,
      maxLife: 26,
      size: 5 + Math.random() * 2.5,
      color: '#ff8a30',
      kind: 'flame'
    });
    if (Math.random() < 0.5) {
      trailParticles.push({
        x: baseX,
        y: baseY + 2,
        vx: -0.3 - Math.random() * 0.3,
        vy: 0.1 + Math.random() * 0.3,
        life: 18,
        maxLife: 18,
        size: 2 + Math.random() * 1.5,
        color: '#5a1a08',
        kind: 'ember'
      });
    }
  }
}

function updateTrailParticles() {
  if (gameState === 'playing' && getActiveTrail()) {
    if (frameCount % 2 === 0) {
      spawnTrailParticleAt(player.x, player.y);
    }
  }
  const scroll = (gameState === 'playing') ? (typeof getPipeSpeed === 'function' ? getPipeSpeed() : 0) : 0;
  for (let i = trailParticles.length - 1; i >= 0; i--) {
    const p = trailParticles[i];
    p.x += p.vx - scroll;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0 || p.x + p.size < -10) {
      trailParticles.splice(i, 1);
    }
  }
}

function drawTrailParticles() {
  if (!trailParticles.length) return;
  if (!settings.effects) { trailParticles.length = 0; return; }
  const perfMobile = window.PERF_MOBILE;
  ctx.save();
  for (const p of trailParticles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    if (p.kind === 'glow') {
      if (!perfMobile) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, trailHexToRgba(p.color, alpha * 0.9));
        grad.addColorStop(1, trailHexToRgba(p.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = trailHexToRgba(p.color, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'flame') {
      ctx.fillStyle = trailHexToRgba(p.color, alpha * 0.85);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = trailHexToRgba('#ffd860', alpha * 0.7);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 1, p.size * 0.5, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'ember') {
      ctx.fillStyle = trailHexToRgba(p.color, alpha);
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
  }
  ctx.restore();
}

function trailHexToRgba(hex, a) {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m) return `rgba(255,255,255,${a})`;
  return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${a})`;
}

function clearTrailParticles() {
  trailParticles.length = 0;
}
