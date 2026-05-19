// ===== SPECIALS — overlay efekty kreslené přes hráče =====
// Více specials lze nasadit současně. Žádný z nich nemění player.r ani logiku kolize.

function getSpecialById(id) { return SPECIALS.find(s => s.id === id) || null; }

function getOwnedSpecials() { return SPECIALS.filter(s => s.unlocked).map(s => s.id); }
function isSpecialEquipped(id) { return selectedSpecialIds.indexOf(id) !== -1; }

function canAffordSpecial(sp) {
  if (!sp) return false;
  const c = sp.cost || {};
  if ((c.yang || 0) > yang) return false;
  if ((c.wallets || 0) > wallets) return false;
  if ((c.dragonCoins || 0) > dragonCoins) return false;
  if ((c.errCubes || 0) > errCubes) return false;
  return true;
}

function buySpecial(id) {
  const sp = getSpecialById(id);
  if (!sp || sp.unlocked) return false;
  if (!canAffordSpecial(sp)) {
    activeVoiceLine = 'Nemáš dost surovin.';
    activeVoiceLineUntil = performance.now() + 2200;
    return false;
  }
  const c = sp.cost || {};
  yang -= (c.yang || 0);
  wallets -= (c.wallets || 0);
  if (c.dragonCoins) spendDragonCoins(c.dragonCoins);
  errCubes -= (c.errCubes || 0);
  sp.unlocked = true;
  saveUnlockedSpecials();
  saveEconomy();
  saveErrCubes();
  updateEconomyUi();
  showUnlockToast('Special odemčen', sp.name, 'skin');
  if (typeof unlockAchievement === 'function') unlockAchievement('bought_any_special');
  return true;
}

function equipSpecial(id) {
  const sp = getSpecialById(id);
  if (!sp || !sp.unlocked) return false;
  if (!isSpecialEquipped(id)) selectedSpecialIds.push(id);
  saveSelectedSpecials();
  return true;
}

function unequipSpecial(id) {
  const idx = selectedSpecialIds.indexOf(id);
  if (idx === -1) return false;
  selectedSpecialIds.splice(idx, 1);
  saveSelectedSpecials();
  return true;
}

function toggleSpecial(id) {
  return isSpecialEquipped(id) ? unequipSpecial(id) : equipSpecial(id);
}

// Kreslí všechny aktivní Specials jako overlay relativní ke středu (0,0).
// VOLAT POUZE V LOKÁLNÍM ctx scope kolem hráče (player.js drawPlayer).
function drawSpecialsOverlay() {
  if (!selectedSpecialIds.length) return;
  const r = player.r; // jen pro pozicování — NIKDY neměnit!
  for (const id of selectedSpecialIds) {
    if (id === 'ghost-rider') drawGhostRiderFlames(r);
    else if (id === 'wraith-eyes') drawWraithEyes(r);
  }
}

function drawGhostRiderFlames(r) {
  const perfMobile = window.PERF_MOBILE;
  const phase = frameCount * 0.18;
  const flames = [
    { ang: -1.92, sz: 0.55 },
    { ang: -1.57, sz: 0.7  },
    { ang: -1.22, sz: 0.55 }
  ];
  ctx.save();
  for (let i = 0; i < flames.length; i++) {
    const f = flames[i];
    const flick = 1 + Math.sin(phase + i * 1.7) * 0.15;
    const cx = Math.cos(f.ang) * (r - 4);
    const cy = Math.sin(f.ang) * (r - 4);
    const h = r * f.sz * flick;
    const w = r * 0.32 * flick;
    if (!perfMobile) {
      const grad = ctx.createRadialGradient(cx, cy - h * 0.3, 0, cx, cy - h * 0.3, h);
      grad.addColorStop(0, 'rgba(255,240,140,0.9)');
      grad.addColorStop(0.55, 'rgba(255,120,40,0.7)');
      grad.addColorStop(1, 'rgba(120,20,4,0)');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgba(255,140,40,0.85)';
    }
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.4, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,160,0.85)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.55, w * 0.45, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWraithEyes(r) {
  const phase = frameCount * 0.04;
  const intensity = 0.75 + (Math.sin(phase) * 0.5 + Math.sin(phase * 0.37) * 0.5) * 0.12;
  const eyeOffsetX = r * 0.32;
  const eyeOffsetY = -r * 0.12;
  const eyeR = r * 0.11;
  const perfMobile = window.PERF_MOBILE;

  ctx.save();
  for (const sign of [-1, 1]) {
    const ex = sign * eyeOffsetX;
    const ey = eyeOffsetY;
    if (!perfMobile) {
      const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR * 3.5);
      grad.addColorStop(0, `rgba(190,120,255,${0.9 * intensity})`);
      grad.addColorStop(0.5, `rgba(140,60,220,${0.45 * intensity})`);
      grad.addColorStop(1, 'rgba(140,60,220,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(230,200,255,${intensity})`;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.85 * intensity})`;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
