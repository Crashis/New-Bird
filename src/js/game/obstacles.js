function spawnPipe() {
  const gap = getPipeGap();
  const minGapTop = 60;
  const maxGapTop = canvas.height - gap - 60;
  const gapTop = minGapTop + Math.random() * (maxGapTop - minGapTop);
  const pipe = {
    x: canvas.width,
    gapTop: gapTop,
    gap: gap,
    passed: false,
    coin: null, // power-up (invincibility / doubleYang / crownBonus / amazonNerf)
    yang: null  // Yang currency
  };

  // Každá mezera má max JEDNU collectable věc, aby se Yang, nesmrtelnost, Double
  // Yang, Crown Bonus a Amazon Nerf nikdy nepřekrývaly. Yang se zkouší první
  // (nejčastější), pak power-up. Anti-bad-luck forcing po delší době bez nálezu.
  pipesSinceYang++;
  pipesSincePowerup++;

  const yangAllowed = pipesSinceYang >= YANG_MIN_PIPES &&
    (Math.random() < YANG_CHANCE || pipesSinceYang >= YANG_FORCE_PIPES);

  if (yangAllowed) {
    pipe.yang = {
      x: canvas.width + PIPE_WIDTH / 2,
      y: gapTop + gap / 2,
      r: YANG_RADIUS,
      value: YANG_VALUE,
      collected: false
    };
    pipesSinceYang = 0;
  } else {
    const powerupAllowed = pipesSincePowerup >= POWERUP_MIN_PIPES &&
      (Math.random() < POWERUP_CHANCE || pipesSincePowerup >= POWERUP_FORCE_PIPES);
    if (powerupAllowed) {
      const type = pickPowerupType();
      pipe.coin = {
        type: type,
        x: canvas.width + PIPE_WIDTH / 2,
        y: gapTop + gap / 2,
        r: COIN_RADIUS,
        collected: false
      };
      pipesSincePowerup = 0;
    }
  }

  pipes.push(pipe);
}

function applyPowerup(coin) {
  if (!coin) return;
  const type = coin.type || 'invincibility';
  switch (type) {
    case 'invincibility': {
      invincibleUntil = performance.now() + getInvincibleDurationMs();
      immortalityUses++;
      saveAchievementCounters();
      if (immortalityUses >= 10) unlockAchievement('immortal_mamrd');
      activeVoiceLine = `NESMRTELNOST ${(getInvincibleDurationMs() / 1000).toFixed(1)}s`;
      activeVoiceLineUntil = performance.now() + 2000;
      spawnPickupParticles(coin, '#f0d080', '#8a6a1f', 24);
      break;
    }
    case 'doubleYang': {
      const dur = getDoubleYangDuration();
      // Overlapping pickups reset to the full duration (don't stack additively).
      doubleYangUntil = performance.now() + dur;
      activeVoiceLine = `DOUBLE YANG ${(dur / 1000).toFixed(1)}s aktivováno`;
      activeVoiceLineUntil = performance.now() + 2400;
      spawnPickupParticles(coin, '#80f0c0', '#f0d080', 24);
      break;
    }
    case 'crownBonus': {
      const bonus = getCrownBonusValue();
      activeVoiceLine = `+${bonus} skóre — Crown Bonus!`;
      activeVoiceLineUntil = performance.now() + 2400;
      spawnPickupParticles(coin, '#fff2a8', '#f0d080', 26);
      // Goes through addScore → win / wallet / shield trigger handled uniformly.
      addScore(bonus);
      break;
    }
    case 'amazonNerf': {
      const roll = Math.random();
      let primary = '#ff8a3c';
      if (roll < AMAZON_NERF_SLOW_CHANCE) {
        amazonNerfSpeedMult = AMAZON_NERF_SLOW_MULT;
        amazonNerfUntil = performance.now() + AMAZON_NERF_DURATION_MS;
        activeVoiceLine = 'Amazon omylem optimalizoval servery.';
        primary = '#80c8ff';
      } else if (roll < AMAZON_NERF_SLOW_CHANCE + AMAZON_NERF_SPEED_CHANCE) {
        amazonNerfSpeedMult = AMAZON_NERF_SPEED_MULT;
        amazonNerfUntil = performance.now() + AMAZON_NERF_DURATION_MS;
        activeVoiceLine = 'Amazon vydal balance patch. Bohužel.';
        primary = '#ff5050';
      } else {
        // Doubling score: pass current score back through addScore so the
        // WIN_SCORE crossover (and Peněženky reward + shield) still fires.
        activeVoiceLine = 'Amazon účetní chyba: skóre zdvojnásobeno.';
        primary = '#f0d080';
        if (score > 0) addScore(score);
      }
      activeVoiceLineUntil = performance.now() + 2800;
      spawnPickupParticles(coin, primary, '#3a2e1a', 28);
      break;
    }
  }
}

function spawnPickupParticles(coin, c1, c2, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: coin.x,
      y: coin.y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 45 + Math.random() * 20,
      size: 2 + Math.random() * 2.5,
      color: Math.random() > 0.45 ? c1 : c2
    });
  }
}

const COIN_STYLES = {
  invincibility: {
    inner: '#fff2a8', mid: '#f0d080', outer: '#8a6a1f',
    glow: 'rgba(240,208,128,0.45)', ring: '#fff2a8',
    label: 'I', font: 'bold 18px Cinzel, serif', textColor: '#3a2e1a',
    pulseSpeed: 0.18, spinSpeed: 0.04
  },
  doubleYang: {
    inner: '#d8fff0', mid: '#5fd0a0', outer: '#1f5a48',
    glow: 'rgba(120,240,200,0.5)', ring: '#d8fff0',
    label: '2x', font: 'bold 13px Cinzel, serif', textColor: '#0f2a20',
    pulseSpeed: 0.20, spinSpeed: 0.045
  },
  crownBonus: {
    inner: '#fff2c8', mid: '#f0c060', outer: '#6a4818',
    glow: 'rgba(255,210,120,0.55)', ring: '#fff5d0',
    label: '👑', font: 'bold 18px serif', textColor: '#3a2e1a',
    pulseSpeed: 0.16, spinSpeed: 0
  },
  amazonNerf: {
    inner: '#ffd0a0', mid: '#ff8030', outer: '#5a1f0a',
    glow: 'rgba(255,140,60,0.55)', ring: '#ffd0a0',
    label: '📦', font: 'bold 17px serif', textColor: '#3a2e1a',
    pulseSpeed: 0.24, spinSpeed: 0
  }
};

function drawCoin(coin) {
  if (!coin || coin.collected) return;
  const style = COIN_STYLES[coin.type] || COIN_STYLES.invincibility;
  const pulse = Math.sin(frameCount * style.pulseSpeed) * 2;
  const r = coin.r + pulse;

  ctx.save();
  ctx.translate(coin.x, coin.y);
  const spinAngle = frameCount * style.spinSpeed;
  ctx.rotate(spinAngle);

  if (settings.effects && !window.PERF_MOBILE) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.4);
    glow.addColorStop(0, style.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const coinGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.45, 2, 0, 0, r);
  coinGrad.addColorStop(0, style.inner);
  coinGrad.addColorStop(0.35, style.mid);
  coinGrad.addColorStop(1, style.outer);
  ctx.fillStyle = coinGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3a2e1a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = style.ring;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.stroke();

  // Counter-rotate the label so it stays upright even when the coin spins.
  ctx.rotate(-spinAngle);
  ctx.fillStyle = style.textColor;
  ctx.font = style.font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.label, 0, 1);

  ctx.restore();
}

function drawYang(coin) {
  if (!coin || coin.collected) return;
  const pulse = Math.sin(frameCount * 0.2) * 1.5;
  const r = coin.r + pulse;

  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.rotate(Math.sin(frameCount * 0.06) * 0.18);

  if (settings.effects && !window.PERF_MOBILE) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r * 2.2);
    glow.addColorStop(0, 'rgba(240,208,128,0.38)');
    glow.addColorStop(1, 'rgba(240,208,128,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r);
  grad.addColorStop(0, '#fff2a8');
  grad.addColorStop(0.35, '#d8b85a');
  grad.addColorStop(1, '#7a5a18');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#3a2e1a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#3a2e1a';
  ctx.font = 'bold 15px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Y', 0, 1);

  ctx.restore();
}

function drawPipe(pipe) {
  const x = pipe.x;
  const gapTop = pipe.gapTop;
  const gapBottom = gapTop + pipe.gap;

  // Top "blade/sword" - pointing down
  drawAmazonBlade(x, 0, PIPE_WIDTH, gapTop, true);
  // Bottom "blade/sword" - pointing up
  drawAmazonBlade(x, gapBottom, PIPE_WIDTH, canvas.height - 20 - gapBottom, false);
}

function drawAmazonBlade(x, y, w, h, pointingDown) {
  // V event fázi je celý blade tmavší, s tlumenějšími kovy a rudým glow.
  const ev = eventPhaseActive;
  const phase = currentGamePhase;
  const isFrost = phase === GAME_PHASES.FROST;
  const isVoid = phase === GAME_PHASES.VOID;

  // Glow halo around the blade body — color závisí na fázi (na mobilu vypnuto).
  if (settings.effects && !window.PERF_MOBILE) {
    let glow = null;
    if (isVoid) glow = 'rgba(180, 80, 230, 0.55)';
    else if (isFrost) glow = 'rgba(80, 160, 255, 0.55)';
    else if (ev) glow = 'rgba(200, 30, 30, 0.55)';
    if (glow) {
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(10,4,16,0.85)';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.restore();
    }
  }

  // Main blade body — barva podle fáze.
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  if (isVoid) {
    grad.addColorStop(0, '#100422');
    grad.addColorStop(0.3, '#2a0d4a');
    grad.addColorStop(0.5, '#451670');
    grad.addColorStop(0.7, '#2a0d4a');
    grad.addColorStop(1, '#100422');
  } else if (isFrost) {
    grad.addColorStop(0, '#04162e');
    grad.addColorStop(0.3, '#0c2c5a');
    grad.addColorStop(0.5, '#1a4a90');
    grad.addColorStop(0.7, '#0c2c5a');
    grad.addColorStop(1, '#04162e');
  } else if (ev) {
    grad.addColorStop(0, '#180404');
    grad.addColorStop(0.3, '#3a1010');
    grad.addColorStop(0.5, '#5a1414');
    grad.addColorStop(0.7, '#3a1010');
    grad.addColorStop(1, '#180404');
  } else {
    grad.addColorStop(0, '#2a1f10');
    grad.addColorStop(0.3, '#5a4520');
    grad.addColorStop(0.5, '#8a6a1f');
    grad.addColorStop(0.7, '#5a4520');
    grad.addColorStop(1, '#2a1f10');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Edges — gold normally, jiná barva v každé fázi.
  let edge = '#c9a84c';
  if (isVoid) edge = '#b070e0';
  else if (isFrost) edge = '#5aa8ff';
  else if (ev) edge = '#a82828';
  ctx.fillStyle = edge;
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);

  // Dark border outline
  ctx.strokeStyle = '#1a1208';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Decorative diamond pattern (New World style)
  ctx.fillStyle = isVoid ? '#c890ff' : isFrost ? '#80c8ff' : ev ? '#c84040' : '#c9a84c';
  const diamondSpacing = 50;
  const startOffset = pointingDown ? h % diamondSpacing : 0;
  for (let dy = startOffset + 20; dy < h - 20; dy += diamondSpacing) {
    ctx.save();
    ctx.translate(x + w / 2, y + dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }

  // Sharp blade tip at the gap end
  const tipY = pointingDown ? y + h : y;
  const tipDir = pointingDown ? 1 : -1;

  // Blade tip cap
  ctx.fillStyle = '#3a2e1a';
  ctx.fillRect(x - 4, tipY - (pointingDown ? 12 : 0), w + 8, 12);
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 4, tipY - (pointingDown ? 12 : 0), w + 8, 12);

  // Sharp tip triangle
  ctx.fillStyle = '#8a6a1f';
  ctx.beginPath();
  if (pointingDown) {
    ctx.moveTo(x - 4, tipY);
    ctx.lineTo(x + w + 4, tipY);
    ctx.lineTo(x + w / 2, tipY + 18);
  } else {
    ctx.moveTo(x - 4, tipY);
    ctx.lineTo(x + w + 4, tipY);
    ctx.lineTo(x + w / 2, tipY - 18);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Highlight on tip
  ctx.fillStyle = 'rgba(240,208,128,0.4)';
  ctx.beginPath();
  if (pointingDown) {
    ctx.moveTo(x + w / 2 - 3, tipY);
    ctx.lineTo(x + w / 2 + 3, tipY);
    ctx.lineTo(x + w / 2, tipY + 14);
  } else {
    ctx.moveTo(x + w / 2 - 3, tipY);
    ctx.lineTo(x + w / 2 + 3, tipY);
    ctx.lineTo(x + w / 2, tipY - 14);
  }
  ctx.closePath();
  ctx.fill();
}
