// ===== COUNTDOWN BEFORE GAME START =====
let isStartingCountdown = false;
let startCountdownTimeout = null;

function clearStartCountdownTimeout() {
  if (startCountdownTimeout !== null) {
    clearTimeout(startCountdownTimeout);
    startCountdownTimeout = null;
  }
}

function jump() {
  if (gameState === 'idle') {
    startGameCountdown();
    return;
  }
  if (gameState === 'playing') {
    player.vy = JUMP_POWER;
    // Add jump particles
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: player.x - 5,
        y: player.y + 10,
        vx: -1 - Math.random() * 2,
        vy: 1 + Math.random() * 2,
        life: 25,
        size: 2 + Math.random() * 2,
        color: '#c9a84c'
      });
    }
  }
}

function startGameCountdown() {
  if (isStartingCountdown) return;

  isStartingCountdown = true;
  clearStartCountdownTimeout();

  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.disabled = true;

  // Hned schovej start menu / game-over / win panel + zavři ostatní overlaye,
  // ať hráč vidí jen herní plochu s odpočtem.
  const startPanelEl = document.getElementById('startPanel');
  if (startPanelEl) startPanelEl.classList.add('hidden');
  const overlayEl = document.getElementById('gameOverlay');
  if (overlayEl) overlayEl.classList.remove('menu-open');
  const gameOverPanelEl = document.getElementById('gameOverPanel');
  if (gameOverPanelEl) gameOverPanelEl.classList.remove('active');
  const winPanelEl = document.getElementById('winPanel');
  if (winPanelEl) winPanelEl.classList.remove('active');
  document.body.classList.remove('modal-open');
  if (typeof closeAllPanels === 'function') closeAllPanels();

  if (animationId) cancelAnimationFrame(animationId);
  loop();

  startCountdownTimeout = setTimeout(() => {
    isStartingCountdown = false;
    startCountdownTimeout = null;
    if (startBtn) startBtn.disabled = false;
    startGameNow();
  }, 1000);
}

function startGame() {
  startGameCountdown();
}

function startGameNow() {
  gameState = 'playing';
  player = { x: 160, y: canvas.height / 2, vy: 0, r: 38, rotation: 0 };
  pipes = [];
  particles = [];
  score = 0;
  frameCount = 0;
  framesUntilNextPipe = 95;
  difficultyLevel = 0;
  framesUntilNextPipe = 95;
  endlessMode = false;
  pipesSincePowerup = 0;
  pipesSinceYang = 0;
  invincibleUntil = 0;
  doubleYangUntil = 0;
  amazonNerfUntil = 0;
  amazonNerfSpeedMult = 1.0;
  runYangs = 0;
  shieldCount = shieldStartOwned ? 1 : 0;
  hasShield = shieldCount > 0;
  walletAwardedThisRun = false;
  shieldPhaseUntil = 0;
  activeVoiceLine = null;
  activeVoiceLineUntil = 0;
  if (typeof resetRocketRunState === 'function') resetRocketRunState();
  unlockAchievement('first_run');
  checkAchievements();
  setNextVoiceLineScore();
  resetEventPhase();
  const overlayEl = document.getElementById('gameOverlay');
  if (overlayEl) overlayEl.classList.remove('menu-open');
  document.getElementById('startPanel').classList.add('hidden');
  document.getElementById('gameOverPanel').classList.remove('active');
  if (typeof hideShareSection === 'function') hideShareSection();
  document.getElementById('winPanel').classList.remove('active');
  const bezosPanel = document.getElementById('bezosPanel');
  if (bezosPanel) bezosPanel.classList.remove('active');
  const finalPanel = document.getElementById('finalPanel');
  if (finalPanel) finalPanel.classList.remove('active');
  document.body.classList.remove('modal-open');
  document.getElementById('gameScore').textContent = '0';
  updateEconomyUi();
  closeAllPanels();
  applySelectedSkinStartEffects();
  startGameMusic();
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

function endGame() {
  clearStartCountdownTimeout();
  if (typeof tryPotionRevive === 'function' && tryPotionRevive()) return;
  if (typeof notifyRunEnded === 'function') notifyRunEnded();
  gameState = 'over';
  stopGameMusic();
  if (typeof applySelectedSkinRunStopEffects === 'function') applySelectedSkinRunStopEffects();
  applySelectedSkinEndGameEffects();
  const isNewRecord = score > bestScore;
  if (isNewRecord) {
    bestScore = score;
    try { localStorage.setItem('nw_flappy_best', String(bestScore)); } catch (e) {}
    document.getElementById('newRecord').classList.add('show');
  } else {
    document.getElementById('newRecord').classList.remove('show');
  }
  document.getElementById('gameBest').textContent = bestScore;
  document.getElementById('finalScore').textContent = score;
  const deathPool = (window.NWI18n && window.NWI18n.getDeathQuotes()) || DEATH_QUOTES;
  document.getElementById('deathQuote').textContent =
    deathPool[Math.floor(Math.random() * deathPool.length)];
  const gameOverPanel = document.getElementById('gameOverPanel');
  gameOverPanel.classList.add('active');
  document.body.classList.add('modal-open');
  applyModalButtonCooldown(gameOverPanel, 320);
  if (typeof showShareSection === 'function') showShareSection();
}

function winGame() {
  clearStartCountdownTimeout();
  if (typeof notifyRunEnded === 'function') notifyRunEnded();
  gameState = 'over';
  stopGameMusic();
  playHmm(); // celebratory HMM
  // Update best score if applicable
  if (score > bestScore) {
    bestScore = score;
    try { localStorage.setItem('nw_flappy_best', String(bestScore)); } catch (e) {}
  }
  document.getElementById('gameBest').textContent = bestScore;
  if (!walletAwardedThisRun && score >= WIN_SCORE) {
    walletAwardedThisRun = true;
    const _walletMult = (typeof getGodiasWalletMultiplier === 'function') ? getGodiasWalletMultiplier() : 1;
    wallets += _walletMult;
    saveEconomy();
    showUnlockToast(t('event.walletWon'), t('event.walletWonSub'), 'wallet');
    activeVoiceLine = t('event.walletVoice');
    activeVoiceLineUntil = performance.now() + 3600;
  }
  updateEconomyUi();
  // Massive celebratory particle burst
  for (let i = 0; i < 80; i++) {
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 60 + Math.random() * 40,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.5 ? '#f0d080' : '#c9a84c'
    });
  }
  // Show win panel
  document.getElementById('winFinalScore').textContent = score;
  const winPool = (window.NWI18n && window.NWI18n.getWinQuotes()) || WIN_QUOTES;
  document.getElementById('winQuote').textContent =
    winPool[Math.floor(Math.random() * winPool.length)];
  const winPanel = document.getElementById('winPanel');
  winPanel.classList.add('active');
  document.body.classList.add('modal-open');
  applyModalButtonCooldown(winPanel, 320);
}

// Společná logika pro bezpečnou mezeru po dialogu — čistí sloupy, resetuje
// frame countdown a chvilkové efekty, takže hráč má prostor zorientovat se,
// než přijde další sloup. Používá se po skóre 20 (continueGame) i po skóre
// 100 (continueFromBezos) — stejný UX po obou milníkech.
function applyMilestoneSafeGap() {
  pipes = [];
  frameCount = 0;
  framesUntilNextPipe = 95;
  pipesSincePowerup = 0;
  pipesSinceYang = 0;
  shieldPhaseUntil = 0;
  doubleYangUntil = 0;
  amazonNerfUntil = 0;
  amazonNerfSpeedMult = 1.0;
  activeVoiceLine = null;
  activeVoiceLineUntil = 0;
  if (player) player.vy = 0;
}

function continueGame() {
  // Resume in endless mode: bigger gaps, slower ramp-up
  gameState = 'playing';
  endlessMode = true;
  document.body.classList.remove('modal-open');
  // Reset difficulty so we have a "rest" — gaps will be big again
  difficultyLevel = 0;
  applyMilestoneSafeGap();
  setNextVoiceLineScore();
  document.getElementById('winPanel').classList.remove('active');
  // Event fáze: hráč právě překročil 20 a pokračuje → aktivovat.
  activateEventPhase();
  startGameMusic();
  loop();
}

function drawBackground() {
  // Dark sky gradient — barva závisí na aktuální fázi.
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (currentGamePhase === GAME_PHASES.VOID) {
    grad.addColorStop(0, '#1a0628');
    grad.addColorStop(0.5, '#0c0214');
    grad.addColorStop(1, '#06010a');
  } else if (currentGamePhase === GAME_PHASES.FROST) {
    grad.addColorStop(0, '#06182e');
    grad.addColorStop(0.5, '#030b1a');
    grad.addColorStop(1, '#01060e');
  } else if (eventPhaseActive) {
    grad.addColorStop(0, '#2c0a08');
    grad.addColorStop(0.5, '#170504');
    grad.addColorStop(1, '#0a0302');
  } else {
    grad.addColorStop(0, '#1a1208');
    grad.addColorStop(0.5, '#0f0a05');
    grad.addColorStop(1, '#0a0806');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pulzující overlay (red/blue/violet podle fáze) — respektuje Effects toggle.
  const perfMobile = window.PERF_MOBILE;
  if (settings.effects && !perfMobile) {
    let overlayColor = null;
    if (currentGamePhase === GAME_PHASES.VOID) overlayColor = '160, 60, 220';
    else if (currentGamePhase === GAME_PHASES.FROST) overlayColor = '60, 120, 220';
    else if (eventPhaseActive) overlayColor = '140, 20, 20';
    if (overlayColor) {
      const pulse = 0.07 + Math.sin(frameCount * 0.04) * 0.04;
      ctx.fillStyle = `rgba(${overlayColor}, ${pulse})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Distant mountains silhouette (parallax)
  const offset = (frameCount * 0.3) % canvas.width;
  ctx.fillStyle = '#1a1510';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 80);
  for (let i = 0; i < canvas.width + 100; i += 40) {
    const h = 40 + Math.sin((i + offset) * 0.05) * 25 + Math.sin((i + offset) * 0.12) * 15;
    ctx.lineTo(i - offset, canvas.height - 60 - h);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  // Closer mountains
  ctx.fillStyle = '#251c10';
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

  // Floating gold particles (atmospheric) — vypnuto v mobile perf módu.
  if (!perfMobile) {
    ctx.fillStyle = 'rgba(201,168,76,0.4)';
    for (let i = 0; i < 15; i++) {
      const x = ((i * 73 + frameCount * 0.5) % canvas.width);
      const y = ((i * 47 + frameCount * 0.8) % canvas.height);
      const s = (i % 3) * 0.5 + 0.5;
      ctx.fillRect(x, y, s, s);
    }
  }

  // Ground (Aeternum corrupted earth)
  ctx.fillStyle = '#2a1f10';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  ctx.fillStyle = '#3a2e1a';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 2);

  // Ground texture
  ctx.fillStyle = 'rgba(201,168,76,0.15)';
  for (let i = 0; i < canvas.width; i += 12) {
    const off = (i + frameCount * 2) % canvas.width;
    ctx.fillRect(canvas.width - off, canvas.height - 18, 4, 2);
  }
}

function drawParticles() {
  if (!settings.effects) {
    if (particles.length) particles.length = 0;
    return;
  }
  for (const p of particles) {
    const alpha = Math.min(1, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function drawCountdownText() {
  if (!isStartingCountdown) return;
  ctx.save();
  ctx.font = 'bold 72px "Cinzel Decorative", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillText('Ready?', canvas.width / 2 + 3, canvas.height / 2 + 3);
  ctx.fillStyle = '#c9a84c';
  ctx.fillText('Ready?', canvas.width / 2, canvas.height / 2);
  const perf = window.PERF_MOBILE;
  if (!perf) {
    ctx.shadowColor = 'rgba(201,168,76,0.8)';
    ctx.shadowBlur = 30;
    ctx.fillText('Ready?', canvas.width / 2, canvas.height / 2);
  }
  ctx.restore();
}

function drawScore() {
  if (gameState !== 'playing') return;
  const perf = window.PERF_MOBILE;
  ctx.save();
  ctx.font = 'bold 48px "Cinzel Decorative", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(score, canvas.width / 2 + 2, 70);
  ctx.fillStyle = '#c9a84c';
  ctx.fillText(score, canvas.width / 2, 68);
  if (!perf) {
    ctx.shadowColor = 'rgba(201,168,76,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText(score, canvas.width / 2, 68);
  }

  ctx.shadowBlur = perf ? 0 : 10;
  ctx.font = 'bold 17px "Cinzel", serif';
  ctx.fillStyle = '#f0d080';
  ctx.fillText(t('canvas.yang', { yang, wallets, errCubes }), canvas.width / 2, 98);

  const invincibleLeft = Math.ceil((invincibleUntil - performance.now()) / 100) / 10;
  let statusY = 130;
  if (invincibleLeft > 0) {
    ctx.shadowBlur = perf ? 0 : 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#f0d080';
    ctx.fillText(t('canvas.invincible', { time: invincibleLeft.toFixed(1) }), canvas.width / 2, statusY);
    statusY += 30;
  }
  const doubleYangLeft = Math.ceil((doubleYangUntil - performance.now()) / 100) / 10;
  if (doubleYangLeft > 0) {
    ctx.shadowBlur = perf ? 0 : 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#80f0c0';
    ctx.fillText(t('canvas.doubleYang', { time: doubleYangLeft.toFixed(1) }), canvas.width / 2, statusY);
    statusY += 30;
  }
  const nerfLeft = Math.ceil((amazonNerfUntil - performance.now()) / 100) / 10;
  if (nerfLeft > 0) {
    ctx.shadowBlur = perf ? 0 : 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    if (amazonNerfSpeedMult < 1) {
      ctx.fillStyle = '#80c8ff';
      ctx.fillText(t('canvas.amazonSlow', { time: nerfLeft.toFixed(1) }), canvas.width / 2, statusY);
    } else {
      ctx.fillStyle = '#ff8a8a';
      ctx.fillText(t('canvas.amazonSpeed', { time: nerfLeft.toFixed(1) }), canvas.width / 2, statusY);
    }
    statusY += 30;
  }
  if (hasShield) {
    ctx.shadowBlur = perf ? 0 : 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#80d8ff';
    ctx.fillText(t('canvas.shield', { count: shieldCount, max: getMaxShields() }), canvas.width / 2, statusY);
  }
  if (activeVoiceLine && performance.now() < activeVoiceLineUntil) {
    ctx.shadowBlur = perf ? 0 : 18;
    ctx.font = 'bold 22px "Cinzel", serif';
    ctx.fillStyle = '#f0d080';
    ctx.textAlign = 'center';
    const text = `„${activeVoiceLine}”`;
    ctx.fillText(text, canvas.width / 2, canvas.height - 58);
  }
  ctx.restore();
}

function draw() {
  drawBackground();
  for (const p of pipes) {
    if (p.destroyed) continue;
    drawPipe(p);
  }
  for (const p of pipes) drawCoin(p.coin);
  for (const p of pipes) drawYang(p.yang);
  drawParticles();
  drawPlayer();
  if (typeof drawRocketLauncher === 'function') drawRocketLauncher();
  if (typeof drawRockets === 'function') drawRockets();
  drawScore();
  if (typeof drawRocketHud === 'function') drawRocketHud();
  drawCountdownText();
}

function loop() {
  if (typeof isBossFightActive === 'function' && isBossFightActive()) {
    if (gameState === 'playing' && typeof updateBossFight === 'function') {
      updateBossFight();
    }
    if (typeof drawBossFight === 'function') drawBossFight();
    if (gameState === 'playing') {
      animationId = requestAnimationFrame(loop);
    }
    return;
  }
  if (gameState === 'playing') {
    update();
  }
  draw();
  if (gameState === 'playing' || isStartingCountdown) {
    animationId = requestAnimationFrame(loop);
  }
}

function openGame() {
  clearStartCountdownTimeout();
  // Po jakémkoli návratu do menu (např. z boss fightu) vždy předpokládáme
  // normální režim — boss fight se nikdy nesmí přelít do normální hry.
  currentGameMode = 'normal';
  ['bossWinPanel', 'bossLossPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  isStartingCountdown = false;
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.disabled = false;
  const overlayEl = document.getElementById('gameOverlay');
  overlayEl.classList.add('active');
  overlayEl.classList.add('menu-open');
  playMenuMusic();
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  resetEventPhase();
  document.getElementById('gameBest').textContent = bestScore;
  document.getElementById('gameScore').textContent = '0';
  updateEconomyUi();
  renderAchievementsPanel();
  closeAllPanels();
  document.getElementById('startPanel').classList.remove('hidden');
  document.getElementById('gameOverPanel').classList.remove('active');
  if (typeof hideShareSection === 'function') hideShareSection();
  document.getElementById('winPanel').classList.remove('active');
  const bezosPanel = document.getElementById('bezosPanel');
  if (bezosPanel) bezosPanel.classList.remove('active');
  const finalPanel = document.getElementById('finalPanel');
  if (finalPanel) finalPanel.classList.remove('active');
  document.body.classList.remove('modal-open');
  gameState = 'idle';
  // Draw initial idle frame
  player = { x: 160, y: canvas.height / 2, vy: 0, r: 38, rotation: 0 };
  pipes = [];
  particles = [];
  difficultyLevel = 0;
  endlessMode = false;
  pipesSincePowerup = 0;
  pipesSinceYang = 0;
  invincibleUntil = 0;
  doubleYangUntil = 0;
  amazonNerfUntil = 0;
  amazonNerfSpeedMult = 1.0;
  hasShield = false;
  shieldCount = 0;
  walletAwardedThisRun = false;
  shieldPhaseUntil = 0;
  activeVoiceLine = null;
  activeVoiceLineUntil = 0;
  setNextVoiceLineScore();
  draw();
  resizeCanvas();
}

function returnToMainMenu() {
  stopGameMusic();
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  openGame();
}

function quitGameFromMainMenu() {
  closeGame();
}

// ===== Milestone modals (Bezos / Final) =====
function pauseForMilestone(panelId, titleKey, subtitleKey, quoteKey) {
  gameState = 'over'; // pauses the rAF loop
  stopGameMusic();
  document.body.classList.add('modal-open');
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const titleEl = panel.querySelector('[data-milestone-title]');
  const subEl = panel.querySelector('[data-milestone-subtitle]');
  const scoreEl = panel.querySelector('[data-milestone-score]');
  const quoteEl = panel.querySelector('[data-milestone-quote]');
  if (titleEl && titleKey) titleEl.textContent = t(titleKey);
  if (subEl && subtitleKey) subEl.textContent = t(subtitleKey);
  if (scoreEl) scoreEl.textContent = score;
  if (quoteEl && quoteKey) quoteEl.textContent = t(quoteKey);
  panel.classList.add('active');
  applyModalButtonCooldown(panel, 320);
}

function applyModalButtonCooldown(panel, ms) {
  const btns = panel.querySelectorAll('button');
  btns.forEach(b => { b.disabled = true; });
  setTimeout(() => { btns.forEach(b => { b.disabled = false; }); }, ms);
}

function resumeFromMilestone(panelId, onResume, opts) {
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.remove('active');
  document.body.classList.remove('modal-open');
  if (typeof onResume === 'function') onResume();
  gameState = 'playing';
  if (opts && opts.safeGap) {
    // Stejná bezpečná mezera jako po skóre 20, aby hráč po dialogu nenarazil
    // do sloupu, který byl při pauze už blízko hráče.
    applyMilestoneSafeGap();
  } else {
    // Drobné očištění frame countdownu, ať další sloup nepřijde okamžitě po pauze.
    framesUntilNextPipe = Math.max(framesUntilNextPipe, 60);
    activeVoiceLine = null;
    activeVoiceLineUntil = 0;
  }
  startGameMusic();
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

function triggerBezosMilestone() {
  if (score100MilestoneShown) return;
  score100MilestoneShown = true;
  pauseForMilestone('bezosPanel', 'milestone.bezos.title', 'milestone.bezos.subtitle', 'milestone.bezos.quote');
}

function continueFromBezos() {
  resumeFromMilestone('bezosPanel', () => {
    activateVoidPhase();
  }, { safeGap: true });
}

function triggerFinalMilestone() {
  if (score500FinalShown) return;
  score500FinalShown = true;
  pauseForMilestone('finalPanel', 'milestone.final.title', 'milestone.final.subtitle', 'milestone.final.quote');
}

function continueFromFinal() {
  resumeFromMilestone('finalPanel', null);
}

// Vrací true, pokud je otevřený jakýkoli blokující dialog,
// při kterém nesmí hra reagovat na klik/tap/space pro skok.
function isBlockingModalOpen() {
  if (document.body.classList.contains('modal-open')) return true;
  const ids = ['gameOverPanel', 'winPanel', 'bezosPanel', 'finalPanel', 'bossWinPanel', 'bossLossPanel'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.classList.contains('active')) return true;
  }
  return false;
}

function closeGame() {
  clearStartCountdownTimeout();
  currentGameMode = 'normal';
  ['bossWinPanel', 'bossLossPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  stopGameMusic();
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  closeAllPanels();
  resetEventPhase();
  document.body.classList.remove('modal-open');
  ['gameOverPanel', 'winPanel', 'bezosPanel', 'finalPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const overlayEl = document.getElementById('gameOverlay');
  overlayEl.classList.remove('active');
  overlayEl.classList.remove('menu-open');
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  gameState = 'idle';
  // Back to the countdown/default screen — return to intro track.
  playIntroMusic();
}
