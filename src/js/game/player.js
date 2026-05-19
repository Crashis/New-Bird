function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rotation);

  // Glow halo — ambient verze přeskočená na mobilu kvůli radial gradientu každý frame;
  // glow aktivních ochran (protection/shield) si necháváme i v perf módu, protože je to
  // důležitý gameplay feedback.
  const invincible = isInvincible();
  const protectedNow = hasActiveProtection();
  const perfMobile = window.PERF_MOBILE;
  const showGlow = protectedNow || hasShield || (settings.effects && !perfMobile);
  if (showGlow) {
    const glowSize = protectedNow || hasShield ? player.r + 24 + Math.sin(frameCount * 0.25) * 5 : player.r + 12;
    const glowGrad = ctx.createRadialGradient(0, 0, player.r - 4, 0, 0, glowSize);
    glowGrad.addColorStop(0, protectedNow ? 'rgba(240,208,128,0.9)' : hasShield ? 'rgba(128,216,255,0.85)' : 'rgba(201,168,76,0.5)');
    glowGrad.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw the head image (circular clip using selected skin)
  {
    const skinImg = skinImages.get(selectedSkinId);
    const imgToDraw = (skinImg && skinImg.complete && skinImg.naturalWidth > 0) ? skinImg
                    : (headImg.complete && headImg.naturalWidth > 0) ? headImg : null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, player.r, 0, Math.PI * 2);
    ctx.clip();
    if (imgToDraw) {
      ctx.drawImage(imgToDraw, -player.r, -player.r, player.r * 2, player.r * 2);
    } else {
      ctx.fillStyle = '#d4a574';
      ctx.fill();
    }
    ctx.restore();
  }

  // Gold ring around head (New World armor vibe)
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, player.r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#8a6a1f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, player.r + 2, 0, Math.PI * 2);
  ctx.stroke();

  if (hasShield) {
    ctx.strokeStyle = '#80d8ff';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, player.r + 15 + Math.sin(frameCount * 0.16) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (invincible) {
    ctx.strokeStyle = '#f0d080';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, player.r + 10 + Math.sin(frameCount * 0.25) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (typeof drawSpecialsOverlay === 'function') drawSpecialsOverlay();
  ctx.restore();

  if (typeof drawKotlarOverlay === 'function') drawKotlarOverlay();
  if (typeof drawExcalibeerOverlay === 'function') drawExcalibeerOverlay();
  if (typeof drawExcalibeerSwing === 'function') drawExcalibeerSwing();
}
