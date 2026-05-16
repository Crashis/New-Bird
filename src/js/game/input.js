function isInteractiveInputTarget(target) {
  return !!(target && target.closest && target.closest(
    'button, input, select, textarea, label, .game-start-panel, .shop-panel, .game-over-panel, .win-panel'
  ));
}

// Input handling
function handleKeyboardInput(e) {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  if (e.code !== 'Space') return;
  if (isInteractiveInputTarget(e.target)) return;
  e.preventDefault();
  if (gameState === 'over') return; // ignore inputs on game over (use buttons)
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  jump();
}

function handlePointerJump(e) {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  if (e.button !== undefined && e.button !== 0) return;
  if (isInteractiveInputTarget(e.target)) return;
  e.preventDefault();
  if (gameState === 'over') return; // ignore inputs on game over (use buttons)
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  jump();
}

document.addEventListener('keydown', handleKeyboardInput);
canvas.addEventListener('pointerdown', handlePointerJump, { passive: false });

// Escape key closes game
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && document.getElementById('gameOverlay').classList.contains('active')) {
    closeGame();
  }
});

// Make canvas responsive (internal 1200x780, CSS scales it)
function resizeCanvas() {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const aspect = 1200 / 780;
  const mobile = window.matchMedia('(max-width: 768px), (max-height: 480px) and (orientation: landscape)').matches;
  const landscape = window.matchMedia('(orientation: landscape)').matches;
  // Mobile-landscape reserved vertical was 145 — too aggressive for short phone viewports,
  // which forced the canvas into height-limited scaling and left the sides empty. Compact
  // HUD (header+stats only, controls/bottom-buttons hidden in landscape CSS) needs ~70 px.
  const reservedV = fs ? (mobile ? 90 : 170) : (mobile ? (landscape ? 70 : 250) : 240);
  const reservedH = fs ? 8 : (mobile ? (landscape ? 8 : 12) : 24);
  // In mobile landscape allow the canvas to scale beyond the 1200px desktop cap so it
  // can actually fill the viewport on wide phones (e.g. 932 CSS px); desktop is unchanged.
  const maxCap = fs ? 100000 : (mobile && landscape ? 100000 : 1200);
  const maxH = Math.max(200, window.innerHeight - reservedV);
  const maxW = Math.max(280, Math.min(maxCap, window.innerWidth - reservedH));
  if (maxW / aspect <= maxH) {
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW / aspect) + 'px';
  } else {
    canvas.style.width = (maxH * aspect) + 'px';
    canvas.style.height = maxH + 'px';
  }
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
