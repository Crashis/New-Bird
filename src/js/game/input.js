// Input handling
function handleInput(e) {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  if (e.type === 'keydown' && e.code !== 'Space') return;
  e.preventDefault();
  if (gameState === 'over') return; // ignore inputs on game over (use buttons)
  jump();
}

document.addEventListener('keydown', handleInput);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });

// Escape key closes game
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && document.getElementById('gameOverlay').classList.contains('active')) {
    closeGame();
  }
});

// Make canvas responsive (internal 1000x780, CSS scales it)
function resizeCanvas() {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const aspect = 1000 / 780;
  const reservedV = fs ? 170 : 240;
  const reservedH = fs ? 8 : 24;
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
