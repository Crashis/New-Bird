// ===== Fullscreen =====
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
  const overlay = document.getElementById('gameOverlay');
  if (!overlay) return;
  if (isFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  } else {
    const req = overlay.requestFullscreen || overlay.webkitRequestFullscreen;
    if (req) {
      const p = req.call(overlay);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }
}

function syncFullscreenButton() {
  const btn = document.getElementById('fullscreenBtn');
  if (!btn) return;
  btn.textContent = isFullscreen() ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
  resizeCanvas();
}

document.addEventListener('fullscreenchange', syncFullscreenButton);
document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
