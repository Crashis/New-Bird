function update() {
  frameCount++;

  // ── Shield regeneration tick ────────────────────────────────────────────
  // Cooldown se počítá jen tady (v aktivním gameplay tiku). Když je hra
  // pauznutá / běží dialog / je otevřený panel, update() neběží, takže se
  // cooldown přirozeně zastaví. V boss fightu se update() nikdy nezavolá,
  // proto regenerace v boss fightu nefunguje by-design.
  if (shieldRegenLevel > 0
      && typeof isShieldRegenAllowedInCurrentMode === 'function'
      && isShieldRegenAllowedInCurrentMode()) {
    const maxS = getMaxShields();
    if (shieldCount < maxS) {
      // Reálný čas v ms — nezávislé na FPS i na zrychlování hry.
      // Když update() po dlouhé pauze (dialog, milestone) opět tikne, dt by
      // mohlo být obrovské. Cap na 50 ms (jeden frame při 20 fps) zajistí,
      // že pauza cooldown nezrychlí.
      const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      if (!shieldRegenLastTickMs || now - shieldRegenLastTickMs > 250) {
        shieldRegenLastTickMs = now;
      }
      const dt = Math.min(50, now - shieldRegenLastTickMs);
      shieldRegenLastTickMs = now;
      shieldRegenElapsedMs += dt;
      const cdMs = (typeof getShieldRegenCooldownMs === 'function') ? getShieldRegenCooldownMs() : 0;
      if (cdMs > 0 && shieldRegenElapsedMs >= cdMs) {
        shieldRegenElapsedMs = 0;
        shieldCount = Math.min(maxS, shieldCount + 1);
        hasShield = shieldCount > 0;
        for (let i = 0; i < 28; i++) {
          particles.push({
            x: player.x, y: player.y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 45 + Math.random() * 20,
            size: 2 + Math.random() * 2,
            color: Math.random() > 0.5 ? '#80d8ff' : '#a0e8ff'
          });
        }
        activeVoiceLine = t('event.shieldRegen');
        activeVoiceLineUntil = performance.now() + 2400;
      }
    } else {
      shieldRegenElapsedMs = 0;
      shieldRegenLastTickMs = 0;
    }
  }

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
