// ===== BEZOS BOSS FIGHT =====
// Speciální herní režim spouštěný z menu „Dungeons“. Sdílí canvas, hlavní
// game loop a fyziku hráče, ale vlastní update/draw + vlastní state.
// Důležité: nikdy nesahá na normální skóre, yangy, raketomet ani ekonomiku.

const BOSS_FIGHT_PLAYER_MAX_HP = 25;
const BOSS_FIGHT_BOSS_MAX_HP = 100;
const BOSS_FIGHT_PHASE2_HP = 50;
const BOSS_FIGHT_ROCKET_DAMAGE = 5;
const BOSS_FIGHT_START_AMMO = 5;
const BOSS_FIGHT_AMMO_INTERVAL = 360;   // ≈ 6 s — záchranný drop náboje
const BOSS_FIGHT_POWERUP_INTERVAL = 900; // ≈ 15 s — občasný štít/nesmrtelnost

let bossPlayerHp = BOSS_FIGHT_PLAYER_MAX_HP;
let bossPlayerAmmo = BOSS_FIGHT_START_AMMO;
let bossPhase = 1;
let bossState = null;
let bossProjectiles = [];
let bossPlayerRockets = [];
let bossPickups = [];
let bossShieldUntil = 0;
let bossInvincibleUntil = 0;
let bossHitFlashUntil = 0;
let bossFrameCount = 0;
let bossRewardClaimed = false;
let bossVictoryAnim = null;

const BOSS_SPRITE = new Image();
let bossSpriteReady = false;
let bossSpriteFailed = false;
BOSS_SPRITE.onload = () => { bossSpriteReady = true; };
BOSS_SPRITE.onerror = () => { bossSpriteFailed = true; };
BOSS_SPRITE.src = 'assets/skins/bezos.png';

const BOSS_FIGHT_HEART_INTERVAL = 2700; // ≈ 45 s — vzácný spawn životů

function isBossFightActive() {
  return currentGameMode === 'bezosBoss';
}

function resetBossFightState() {
  player = { x: 160, y: canvas.height / 2, vy: 0, r: 38, rotation: 0 };
  particles = [];
  pipes = [];
  bossPlayerHp = BOSS_FIGHT_PLAYER_MAX_HP;
  bossPlayerAmmo = BOSS_FIGHT_START_AMMO;
  bossPhase = 1;
  bossProjectiles = [];
  bossPlayerRockets = [];
  bossPickups = [];
  bossShieldUntil = 0;
  bossInvincibleUntil = 0;
  bossHitFlashUntil = 0;
  bossFrameCount = 0;
  bossRewardClaimed = false;
  bossVictoryAnim = null;
  bossState = {
    x: canvas.width - 160,
    y: canvas.height / 2,
    vy: 1.4,
    r: 76,
    hp: BOSS_FIGHT_BOSS_MAX_HP,
    fireCooldown: 90
  };
}

function startBezosBossFight() {
  // Bezpečnostní pojistka: bez vstupenky neumožnit spuštění.
  if (typeof isBezosBossTicketUnlocked === 'function' && !isBezosBossTicketUnlocked()) {
    return;
  }
  currentGameMode = 'bezosBoss';
  // Zavřít všechny menu panely + nastavit overlay do herního stavu.
  if (typeof closeAllPanels === 'function') closeAllPanels();
  const startPanel = document.getElementById('startPanel');
  if (startPanel) startPanel.classList.add('hidden');
  const overlayEl = document.getElementById('gameOverlay');
  if (overlayEl) overlayEl.classList.remove('menu-open');
  ['gameOverPanel', 'winPanel', 'bezosPanel', 'finalPanel', 'bossWinPanel', 'bossLossPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  document.body.classList.remove('modal-open');

  resetBossFightState();
  gameState = 'playing';
  if (typeof startGameMusic === 'function') startGameMusic();
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

function exitBossFightToMenu() {
  // Tvrdá izolace — nikdy nepřepsat normální stav.
  currentGameMode = 'normal';
  bossProjectiles = [];
  bossPlayerRockets = [];
  bossPickups = [];
  bossState = null;
  bossVictoryAnim = null;
  ['bossWinPanel', 'bossLossPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  document.body.classList.remove('modal-open');
  if (typeof openGame === 'function') openGame();
}

const BOSS_REWARD = { yang: 100, wallets: 6, dragonCoins: 5, errCubes: 2 };

function claimBossVictoryReward() {
  if (bossRewardClaimed) return;
  bossRewardClaimed = true;
  yang += BOSS_REWARD.yang;
  wallets += BOSS_REWARD.wallets;
  dragonCoins += BOSS_REWARD.dragonCoins;
  errCubes += BOSS_REWARD.errCubes;
  if (typeof saveEconomy === 'function') saveEconomy();
  if (typeof saveDragonCoins === 'function') saveDragonCoins();
  if (typeof saveErrCubes === 'function') saveErrCubes();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
}

function startBossVictoryAnimation() {
  const confetti = [];
  const colors = ['#ffd700', '#ff5040', '#80d8ff', '#c890ff', '#fff2a8', '#a0ff80'];
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      r: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2
    });
  }
  bossVictoryAnim = {
    startedAt: performance.now(),
    confetti: confetti,
    showPanelAt: performance.now() + 1800
  };
}

function endBossFightVictory() {
  if (bossState && bossState.hp > 0) bossState.hp = 0;
  if (typeof stopGameMusic === 'function') stopGameMusic();
  claimBossVictoryReward();
  startBossVictoryAnimation();
  // Hra ještě běží kvůli animaci; loop si přepne na panel přes updateBossVictoryAnim.
}

function showBossWinPanel() {
  gameState = 'over';
  const panel = document.getElementById('bossWinPanel');
  if (panel) {
    const rewardEl = document.getElementById('bossWinRewardText');
    if (rewardEl) {
      rewardEl.textContent = t('bossFight.rewardText', {
        yang: BOSS_REWARD.yang,
        wallets: BOSS_REWARD.wallets,
        dragonCoins: BOSS_REWARD.dragonCoins,
        errCubes: BOSS_REWARD.errCubes
      });
    }
    panel.classList.add('active');
  }
  document.body.classList.add('modal-open');
  if (typeof applyModalButtonCooldown === 'function') applyModalButtonCooldown(panel, 320);
}

function updateBossVictoryAnim() {
  if (!bossVictoryAnim) return;
  const now = performance.now();
  for (const c of bossVictoryAnim.confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.08;
    c.rot += c.vr;
  }
  if (now >= bossVictoryAnim.showPanelAt && gameState !== 'over') {
    showBossWinPanel();
  }
}

function drawBossVictoryAnim() {
  if (!bossVictoryAnim) return;
  const now = performance.now();
  const elapsed = now - bossVictoryAnim.startedAt;
  ctx.save();
  // Screen shake na první 400 ms
  if (elapsed < 400) {
    const s = (1 - elapsed / 400) * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  // Konfety
  for (const c of bossVictoryAnim.confetti) {
    if (c.y > canvas.height + 20) continue;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.r / 2, -c.r / 2, c.r, c.r * 1.4);
    ctx.restore();
  }
  // Blikající VICTORY text
  const blink = Math.floor(elapsed / 220) % 2 === 0;
  ctx.fillStyle = blink ? '#ffd700' : '#fff2a8';
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 6;
  ctx.font = 'bold 110px "Cinzel Decorative", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const txt = (typeof t === 'function') ? t('bossFight.victoryFlash') : 'VICTORY!';
  ctx.strokeText(txt, canvas.width / 2, canvas.height / 2);
  ctx.fillText(txt, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

function endBossFightDefeat() {
  gameState = 'over';
  if (typeof stopGameMusic === 'function') stopGameMusic();
  const panel = document.getElementById('bossLossPanel');
  if (panel) panel.classList.add('active');
  document.body.classList.add('modal-open');
  if (typeof applyModalButtonCooldown === 'function') applyModalButtonCooldown(panel, 320);
}

function fireBossRocket() {
  if (!isBossFightActive()) return;
  if (gameState !== 'playing') return;
  if (bossPlayerAmmo <= 0) {
    activeVoiceLine = 'Žádné náboje';
    activeVoiceLineUntil = performance.now() + 1200;
    return;
  }
  bossPlayerAmmo--;
  bossPlayerRockets.push({
    x: player.x + player.r,
    y: player.y,
    vx: 16,
    r: 8,
    active: true
  });
}

function spawnBossProjectile() {
  if (!bossState) return;
  const aimErrorY = bossPhase === 2 ? 35 : 110;
  const targetY = player.y + (Math.random() - 0.5) * aimErrorY;
  const dx = player.x - bossState.x;
  const dy = targetY - bossState.y;
  const len = Math.hypot(dx, dy) || 1;
  const spd = bossPhase === 2 ? 7.5 : 5.2;
  bossProjectiles.push({
    x: bossState.x - bossState.r * 0.6,
    y: bossState.y,
    vx: dx / len * spd,
    vy: dy / len * spd,
    r: 10,
    hit: false
  });
}

function spawnBossPickup(type) {
  bossPickups.push({
    x: canvas.width + 30,
    y: 90 + Math.random() * (canvas.height - 200),
    r: 18,
    type: type,
    collected: false
  });
}

function updateBossFight() {
  if (!bossState) return;
  if (bossVictoryAnim) {
    updateBossVictoryAnim();
    return;
  }
  bossFrameCount++;

  // ─── Hráč: fyzika stejná jako v normální hře ───
  player.vy += getGravity();
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;
  player.y += player.vy;
  player.rotation = Math.max(-0.4, Math.min(1.0, player.vy * 0.08));

  // Podlaha / strop — v boss fightu hráč nezemře nárazem, jen se zastaví.
  if (player.y + player.r > canvas.height - 20) {
    player.y = canvas.height - 20 - player.r;
    player.vy = 0;
  }
  if (player.y - player.r < 0) {
    player.y = player.r;
    player.vy = 0;
  }

  // ─── Boss: pohyb nahoru / dolů ───
  bossState.y += bossState.vy;
  if (bossState.y - bossState.r < 30) {
    bossState.y = 30 + bossState.r;
    bossState.vy = Math.abs(bossState.vy);
  } else if (bossState.y + bossState.r > canvas.height - 30) {
    bossState.y = canvas.height - 30 - bossState.r;
    bossState.vy = -Math.abs(bossState.vy);
  }

  // ─── Boss střelba ───
  bossState.fireCooldown--;
  if (bossState.fireCooldown <= 0) {
    const base = bossPhase === 2 ? 32 : 80;
    const jitter = bossPhase === 2 ? 14 : 32;
    bossState.fireCooldown = base + Math.random() * jitter;
    spawnBossProjectile();
  }

  // ─── Projektily ───
  for (const p of bossProjectiles) {
    p.x += p.vx;
    p.y += p.vy;
  }
  bossProjectiles = bossProjectiles.filter(p =>
    !p.hit && p.x > -60 && p.x < canvas.width + 60 && p.y > -60 && p.y < canvas.height + 60
  );

  // ─── Zásah hráče ───
  const now = performance.now();
  const invincible = now < bossInvincibleUntil;
  const shielded = now < bossShieldUntil;
  for (const p of bossProjectiles) {
    if (p.hit) continue;
    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      p.hit = true;
      if (invincible) continue;
      if (shielded) {
        bossShieldUntil = 0;
        continue;
      }
      bossPlayerHp -= 1;
      bossInvincibleUntil = now + 600; // krátké i-frames, ať jeden hit nesundá víc
      if (bossPlayerHp <= 0) {
        bossPlayerHp = 0;
        endBossFightDefeat();
        return;
      }
    }
  }

  // ─── Hráčské rakety ───
  for (const r of bossPlayerRockets) {
    if (!r.active) continue;
    r.x += r.vx;
    if (r.x > canvas.width + 40) { r.active = false; continue; }
    if (Math.abs(r.y - bossState.y) < bossState.r && r.x >= bossState.x - bossState.r) {
      r.active = false;
      bossState.hp -= BOSS_FIGHT_ROCKET_DAMAGE;
      bossHitFlashUntil = now + 220;
      if (bossPhase === 1 && bossState.hp <= BOSS_FIGHT_PHASE2_HP) {
        bossPhase = 2;
        // Vizuální tematika fáze 2 — používáme existující VOID overlay.
        if (typeof activateVoidPhase === 'function') activateVoidPhase();
      }
      if (bossState.hp <= 0) {
        bossState.hp = 0;
        endBossFightVictory();
        return;
      }
    }
  }
  bossPlayerRockets = bossPlayerRockets.filter(r => r.active);

  // ─── Periodické dropy ───
  // +1 náboj cca každých 6 s, aby boss fight nešel softlocknout.
  if (bossFrameCount % BOSS_FIGHT_AMMO_INTERVAL === 0) {
    spawnBossPickup('ammo');
  }
  // Občasný štít nebo nesmrtelnost.
  if (bossFrameCount > 0 && bossFrameCount % BOSS_FIGHT_POWERUP_INTERVAL === 0) {
    spawnBossPickup(Math.random() < 0.6 ? 'shield' : 'invincibility');
  }
  // Vzácný spawn životů — cca každých 45 s a ještě s 50% šancí.
  if (bossFrameCount > 0 && bossFrameCount % BOSS_FIGHT_HEART_INTERVAL === 0) {
    if (Math.random() < 0.5) spawnBossPickup('heart');
  }

  for (const d of bossPickups) d.x -= 3;
  for (const d of bossPickups) {
    if (d.collected) continue;
    if (d.x < -40) { d.collected = true; continue; }
    if (Math.hypot(player.x - d.x, player.y - d.y) < player.r + d.r) {
      d.collected = true;
      if (d.type === 'ammo') bossPlayerAmmo++;
      else if (d.type === 'shield') bossShieldUntil = now + 8000;
      else if (d.type === 'invincibility') bossInvincibleUntil = now + 4000;
      else if (d.type === 'heart') {
        if (bossPlayerHp < BOSS_FIGHT_PLAYER_MAX_HP) bossPlayerHp++;
      }
    }
  }
  bossPickups = bossPickups.filter(d => !d.collected);

  // Drobné particle úklidové ticky — sdílíme s normální hrou, ale je to OK,
  // protože v boss fightu nemáme jiné spawnery částic.
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
}

// ─── Vykreslování ──────────────────────────────────────────

function drawBossFight() {
  if (typeof drawBackground === 'function') drawBackground();
  if (typeof drawParticles === 'function') drawParticles();

  drawBossPickups();
  drawBoss();
  drawBossProjectiles();
  drawBossPlayerRockets();

  // Hráč: použijeme existující drawPlayer, který respektuje skiny.
  // Pro vizuál ochrany dočasně nastavíme efektové stavy přes lokální fallback.
  const now = performance.now();
  const showShield = now < bossShieldUntil;
  const showInv = now < bossInvincibleUntil;
  // Žádné globální upravování — kreslíme jen kruhy ručně okolo hráče.
  if (typeof drawPlayer === 'function') drawPlayer();
  if (showShield) {
    ctx.save();
    ctx.strokeStyle = '#80d8ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 5]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (showInv) {
    ctx.save();
    ctx.strokeStyle = '#f0d080';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawBossFightHud();
  drawBossVictoryAnim();
}

function drawBoss() {
  if (!bossState) return;
  const flash = performance.now() < bossHitFlashUntil;
  ctx.save();
  ctx.translate(bossState.x, bossState.y);

  // Glow halo
  if (settings.effects && !window.PERF_MOBILE) {
    const grad = ctx.createRadialGradient(0, 0, bossState.r * 0.4, 0, 0, bossState.r * 2);
    grad.addColorStop(0, bossPhase === 2 ? 'rgba(200,80,255,0.55)' : 'rgba(255,160,80,0.45)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, bossState.r * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (bossSpriteReady && !bossSpriteFailed) {
    const size = bossState.r * 2;
    if (flash) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 30;
    }
    ctx.drawImage(BOSS_SPRITE, -bossState.r, -bossState.r, size, size);
  } else {
    // Fallback — kdyby se obrázek nepodařilo načíst.
    ctx.fillStyle = flash ? '#ffffff' : (bossPhase === 2 ? '#3a0d4a' : '#2a1f10');
    ctx.beginPath();
    ctx.arc(0, 0, bossState.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bossPhase === 2 ? '#c890ff' : '#c9a84c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = bossPhase === 2 ? '#fff2a8' : '#f0d080';
    ctx.font = 'bold 96px "Cinzel Decorative", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B', 0, 4);
  }
  ctx.restore();
}

function drawBossProjectiles() {
  for (const p of bossProjectiles) {
    ctx.save();
    ctx.fillStyle = '#ff5040';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a0a0a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function drawBossPlayerRockets() {
  const perf = window.PERF_MOBILE;
  for (const r of bossPlayerRockets) {
    ctx.save();
    if (!perf && settings.effects) {
      ctx.fillStyle = 'rgba(255,160,80,0.45)';
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(r.x - i * 8, r.y, Math.max(1, r.r - i * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#3a2418';
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0d080';
    ctx.fillRect(r.x - 4, r.y - 2, 8, 4);
    ctx.fillStyle = '#ff5040';
    ctx.beginPath();
    ctx.arc(r.x + r.r, r.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBossPickups() {
  for (const d of bossPickups) {
    if (d.collected) continue;
    ctx.save();
    let inner = '#fff2a8', outer = '#8a6a1f', label = '🚀';
    if (d.type === 'shield') { inner = '#d0f0ff'; outer = '#205a90'; label = '🛡'; }
    else if (d.type === 'invincibility') { inner = '#fff2a8'; outer = '#8a6a1f'; label = '⚜'; }
    else if (d.type === 'heart') { inner = '#ffd0d8'; outer = '#a01030'; label = '❤'; }
    const grad = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.4, 2, d.x, d.y, d.r);
    grad.addColorStop(0, inner);
    grad.addColorStop(1, outer);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2e1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3a2e1a';
    ctx.font = 'bold 17px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, d.x, d.y + 1);
    ctx.restore();
  }
}

function drawBossFightHud() {
  const perf = window.PERF_MOBILE;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (!perf) ctx.shadowBlur = 8;

  // Player HP (vlevo nahoře)
  ctx.font = 'bold 18px "Cinzel", serif';
  ctx.fillStyle = '#ff8a8a';
  ctx.fillText(`❤ ${t('bossFight.playerHp')}: ${bossPlayerHp}/${BOSS_FIGHT_PLAYER_MAX_HP}`, 18, 18);
  ctx.fillStyle = '#f0d080';
  ctx.fillText(`🚀 ${t('bossFight.ammo')}: ${bossPlayerAmmo}`, 18, 44);

  // Boss HP (vpravo nahoře)
  ctx.textAlign = 'right';
  ctx.fillStyle = bossPhase === 2 ? '#c890ff' : '#ff8a3c';
  ctx.fillText(`👔 ${t('bossFight.bossHp')}: ${bossState ? bossState.hp : 0}/${BOSS_FIGHT_BOSS_MAX_HP}`, canvas.width - 18, 18);
  ctx.fillStyle = '#f0d080';
  ctx.fillText(`${t('bossFight.phase')}: ${bossPhase}/2`, canvas.width - 18, 44);

  // Status efekty
  ctx.textAlign = 'center';
  let y = 78;
  const now = performance.now();
  if (now < bossShieldUntil) {
    const left = ((bossShieldUntil - now) / 1000).toFixed(1);
    ctx.fillStyle = '#80d8ff';
    ctx.fillText(`🛡 ${t('bossFight.shield')}: ${left}s`, canvas.width / 2, y);
    y += 28;
  }
  if (now < bossInvincibleUntil) {
    const left = ((bossInvincibleUntil - now) / 1000).toFixed(1);
    ctx.fillStyle = '#f0d080';
    ctx.fillText(`⚜ ${t('bossFight.invincible')}: ${left}s`, canvas.width / 2, y);
  }
  ctx.restore();
}
