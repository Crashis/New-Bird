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
  if (e.button !== undefined && e.button === 2) {
    // Right click — rocket fire (handled separately on mousedown)
    return;
  }
  if (e.button !== undefined && e.button !== 0) return;
  if (isInteractiveInputTarget(e.target)) return;
  e.preventDefault();
  if (gameState === 'over') return; // ignore inputs on game over (use buttons)
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  jump();
}

function handleRocketFire(e) {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay.classList.contains('active')) return;
  if (e.button !== 2) return;
  e.preventDefault();
  e.stopPropagation();
  if (gameState !== 'playing') return;
  if (typeof isBlockingModalOpen === 'function' && isBlockingModalOpen()) return;
  if (typeof fireRocket === 'function') fireRocket();
}

document.addEventListener('keydown', handleKeyboardInput);
canvas.addEventListener('pointerdown', handlePointerJump, { passive: false });
canvas.addEventListener('mousedown', handleRocketFire);
canvas.addEventListener('contextmenu', (e) => {
  if (gameState === 'playing') e.preventDefault();
});

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
  const mobile = window.matchMedia('(max-width: 950px), (max-height: 520px) and (orientation: landscape)').matches;
  const landscape = window.matchMedia('(orientation: landscape)').matches;
  const coarse = (function () { try { return window.matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } })();
  const mobileLandscape = landscape && (mobile || coarse || window.innerHeight <= 520);
  const reservedV = fs ? (mobile ? 90 : 170) : (mobile ? (landscape ? 70 : 250) : 240);
  const reservedH = fs ? 8 : (mobile ? (landscape ? 8 : 12) : 24);
  const maxCap = fs ? 100000 : (mobile && landscape ? 100000 : 1200);
  const maxH = Math.max(200, window.innerHeight - reservedV);
  const maxW = Math.max(280, Math.min(maxCap, window.innerWidth - reservedH));

  // Mobile landscape: prioritize using the full viewport width even if it means
  // breaking the 1200x780 aspect ratio. Internal physics still runs at 1200x780;
  // CSS stretch is purely visual. Cap the horizontal stretch at 1.25x to avoid
  // making the bird look comically squished on ultra-wide phones.
  if (mobileLandscape) {
    const targetW = maxW;
    const fitH = targetW / aspect;
    if (fitH <= maxH) {
      // Width-limited fit — use full width, aspect preserved.
      canvas.style.width = targetW + 'px';
      canvas.style.height = fitH + 'px';
    } else {
      // Not enough vertical room: keep full width and let the canvas stretch
      // vertically less than aspect would dictate (visual deformation accepted).
      const stretchedH = maxH;
      const stretchedW = Math.min(targetW, stretchedH * aspect * 1.25);
      canvas.style.width = stretchedW + 'px';
      canvas.style.height = stretchedH + 'px';
    }
    return;
  }

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
