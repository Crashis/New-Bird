function update() {
  frameCount++;

  // Player physics (dynamic gravity + terminal velocity cap)
  player.vy += getGravity();
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;
  player.y += player.vy;
  player.rotation = Math.max(-0.4, Math.min(1.0, player.vy * 0.08));

  // Spawn pipes via countdown, not modulo. This prevents sudden adjacent pipes when difficulty changes.
  framesUntilNextPipe--;
  if (framesUntilNextPipe <= 0) {
    spawnPipe();
    framesUntilNextPipe = getNextPipeDelay();
  }

  // Move pipes (dynamic speed)
  const speed = getPipeSpeed();
  for (const p of pipes) {
    p.x -= speed;
    if (p.coin && !p.coin.collected) p.coin.x -= speed;
    if (p.yang && !p.yang.collected) p.yang.x -= speed;
    if (!p.passed && p.x + PIPE_WIDTH < player.x) {
      p.passed = true;
      if (!p.destroyed) {
        addScore(1);
        if (gameState !== 'playing') return;
      }
    }
  }
  pipes = pipes.filter(p => p.x + PIPE_WIDTH > 0);

  // Power-up pickup (invincibility / doubleYang / crownBonus / amazonNerf).
  // Each pipe pair holds at most one collectable (Yang or coin), so picking a
  // coin can never collide with picking a Yang in the same gap.
  for (const p of pipes) {
    const coin = p.coin;
    if (!coin || coin.collected) continue;
    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    if (Math.hypot(dx, dy) < player.r + coin.r) {
      coin.collected = true;
      applyPowerup(coin);
      if (gameState !== 'playing') return;
    }
  }

  // Yang pickup: běžná měna do shopu. Během Double Yang efektu dvojnásobek.
  for (const p of pipes) {
    const coin = p.yang;
    if (!coin || coin.collected) continue;
    const dx = player.x - coin.x;
    const dy = player.y - coin.y;
    if (Math.hypot(dx, dy) < player.r + coin.r) {
      coin.collected = true;
      const mult = isDoubleYangActive() ? 2 : 1;
      const godiaMult = (typeof getGodiasWalletMultiplier === 'function') ? getGodiasWalletMultiplier() : 1;
      const moonMult = (typeof getRunCurrencyMultiplier === 'function') ? getRunCurrencyMultiplier() : 1;
      const earned = coin.value * mult * godiaMult * moonMult;
      addYangs(earned);
      runYangs += earned;
      activeVoiceLine = mult > 1 ? `+${earned} Yangy (Double!)` : `+${earned} Yangy`;
      activeVoiceLineUntil = performance.now() + 1800;
      for (let i = 0; i < 18; i++) {
        particles.push({
          x: coin.x,
          y: coin.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 35 + Math.random() * 18,
          size: 1.8 + Math.random() * 2.2,
          color: Math.random() > 0.35 ? '#f0d080' : (mult > 1 ? '#80f0c0' : '#c9a84c')
        });
      }
    }
  }

  // Update particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  const protectedNow = hasActiveProtection();

  // Collision: ground / ceiling
  if (player.y + player.r > canvas.height - 20 || player.y - player.r < 0) {
    if (!protectedNow) {
      endGame();
      return;
    }
    player.y = Math.max(player.r, Math.min(canvas.height - 20 - player.r, player.y));
    player.vy = 0;
  }

  if (typeof updateRockets === 'function') updateRockets();

  // Collision with pipes (use per-pipe gap)
  if (!protectedNow) {
    for (const p of pipes) {
      if (p.destroyed) continue;
      if (player.x + player.r > p.x && player.x - player.r < p.x + PIPE_WIDTH) {
        if (player.y - player.r < p.gapTop || player.y + player.r > p.gapTop + p.gap) {
          if (hasShield) {
            consumeShield(p, speed);
            return;
          }
          endGame();
          return;
        }
      }
    }
  }
}
