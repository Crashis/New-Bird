// ===== Fullscreen =====
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function toggleFullscreen() {
  const overlay = document.getElementById('gameOverlay');
  const fullscreenTarget = overlay && overlay.classList.contains('active')
    ? overlay
    : document.documentElement;

  if (isFullscreen()) {
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (exit) exit.call(document);
  } else {
    const req = fullscreenTarget.requestFullscreen || fullscreenTarget.webkitRequestFullscreen;
    if (req) {
      const p = req.call(fullscreenTarget);
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }
}

function syncFullscreenButton() {
  const buttons = document.querySelectorAll('#fullscreenBtn, #countdownFullscreenBtn');
  for (const btn of buttons) {
    btn.textContent = isFullscreen() ? '⛶ Ukončit fullscreen' : '⛶ Fullscreen';
  }
  resizeCanvas();
}

document.addEventListener('fullscreenchange', syncFullscreenButton);
document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
