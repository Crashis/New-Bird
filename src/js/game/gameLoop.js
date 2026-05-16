function jump() {
  if (gameState === 'idle') {
    startGame();
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

function startGame() {
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
  hasShield = shieldStartOwned;
  walletAwardedThisRun = false;
  shieldPhaseUntil = 0;
  activeVoiceLine = null;
  activeVoiceLineUntil = 0;
  unlockAchievement('first_run');
  setNextVoiceLineScore();
  resetEventPhase();
  const overlayEl = document.getElementById('gameOverlay');
  if (overlayEl) overlayEl.classList.remove('menu-open');
  document.getElementById('startPanel').classList.add('hidden');
  document.getElementById('gameOverPanel').classList.remove('active');
  document.getElementById('winPanel').classList.remove('active');
  document.getElementById('gameScore').textContent = '0';
  updateEconomyUi();
  closeAllPanels();
  applySelectedSkinStartEffects();
  startGameMusic();
  if (animationId) cancelAnimationFrame(animationId);
  loop();
}

function endGame() {
  gameState = 'over';
  stopGameMusic();
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
  document.getElementById('gameOverPanel').classList.add('active');
}

function winGame() {
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
    wallets += 1;
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
  document.getElementById('winPanel').classList.add('active');
}

function continueGame() {
  // Resume in endless mode: bigger gaps, slower ramp-up
  gameState = 'playing';
  endlessMode = true;
  // Reset difficulty so we have a "rest" — gaps will be big again
  difficultyLevel = 0;
  // Clear pipes so the next one spawns fresh after a break
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
  setNextVoiceLineScore();
  // Re-center player & zero velocity for a clean restart
  player.vy = 0;
  document.getElementById('winPanel').classList.remove('active');
  // Event fáze: hráč právě překročil 20 a pokračuje → aktivovat.
  activateEventPhase();
  startGameMusic();
  loop();
}

function drawBackground() {
  // Dark sky gradient (Aeternum night) — switches to corrupted red tones in event phase.
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (eventPhaseActive) {
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

  // Lehký pulzující rudý overlay v event fázi (respektuje Effects toggle).
  if (eventPhaseActive && settings.effects) {
    const pulse = 0.07 + Math.sin(frameCount * 0.04) * 0.04;
    ctx.fillStyle = `rgba(140, 20, 20, ${pulse})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

  // Floating gold particles (atmospheric)
  ctx.fillStyle = 'rgba(201,168,76,0.4)';
  for (let i = 0; i < 15; i++) {
    const x = ((i * 73 + frameCount * 0.5) % canvas.width);
    const y = ((i * 47 + frameCount * 0.8) % canvas.height);
    const s = (i % 3) * 0.5 + 0.5;
    ctx.fillRect(x, y, s, s);
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

function drawScore() {
  if (gameState !== 'playing') return;
  ctx.save();
  ctx.font = 'bold 48px "Cinzel Decorative", serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillText(score, canvas.width / 2 + 2, 70);
  ctx.fillStyle = '#c9a84c';
  ctx.fillText(score, canvas.width / 2, 68);
  ctx.shadowColor = 'rgba(201,168,76,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillText(score, canvas.width / 2, 68);

  ctx.shadowBlur = 10;
  ctx.font = 'bold 17px "Cinzel", serif';
  ctx.fillStyle = '#f0d080';
  ctx.fillText(t('canvas.yang', { yang, wallets }), canvas.width / 2, 98);

  const invincibleLeft = Math.ceil((invincibleUntil - performance.now()) / 100) / 10;
  let statusY = 130;
  if (invincibleLeft > 0) {
    ctx.shadowBlur = 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#f0d080';
    ctx.fillText(t('canvas.invincible', { time: invincibleLeft.toFixed(1) }), canvas.width / 2, statusY);
    statusY += 30;
  }
  const doubleYangLeft = Math.ceil((doubleYangUntil - performance.now()) / 100) / 10;
  if (doubleYangLeft > 0) {
    ctx.shadowBlur = 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#80f0c0';
    ctx.fillText(t('canvas.doubleYang', { time: doubleYangLeft.toFixed(1) }), canvas.width / 2, statusY);
    statusY += 30;
  }
  const nerfLeft = Math.ceil((amazonNerfUntil - performance.now()) / 100) / 10;
  if (nerfLeft > 0) {
    ctx.shadowBlur = 16;
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
    ctx.shadowBlur = 16;
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillStyle = '#80d8ff';
    ctx.fillText(t('canvas.shield'), canvas.width / 2, statusY);
  }
  if (activeVoiceLine && performance.now() < activeVoiceLineUntil) {
    ctx.shadowBlur = 18;
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
  for (const p of pipes) drawPipe(p);
  for (const p of pipes) drawCoin(p.coin);
  for (const p of pipes) drawYang(p.yang);
  drawParticles();
  drawPlayer();
  drawScore();
}

function loop() {
  if (gameState === 'playing') {
    update();
  }
  draw();
  if (gameState === 'playing') {
    animationId = requestAnimationFrame(loop);
  }
}

function openGame() {
  const overlayEl = document.getElementById('gameOverlay');
  overlayEl.classList.add('active');
  overlayEl.classList.add('menu-open');
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
  document.getElementById('winPanel').classList.remove('active');
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

function closeGame() {
  stopGameMusic();
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  closeAllPanels();
  resetEventPhase();
  const overlayEl = document.getElementById('gameOverlay');
  overlayEl.classList.remove('active');
  overlayEl.classList.remove('menu-open');
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  gameState = 'idle';
}
