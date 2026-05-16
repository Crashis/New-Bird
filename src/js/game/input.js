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
  jump();
}

function handlePointerJump(e) {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  if (e.button !== undefined && e.button !== 0) return;
  if (isInteractiveInputTarget(e.target)) return;
  e.preventDefault();
  if (gameState === 'over') return; // ignore inputs on game over (use buttons)
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
  const reservedV = fs ? (mobile ? 120 : 170) : (mobile ? (landscape ? 145 : 250) : 240);
  const reservedH = fs ? 8 : (mobile ? 18 : 24);
  const maxCap = fs ? 100000 : 1200;
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
