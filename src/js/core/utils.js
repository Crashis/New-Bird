window.NWUtils = window.NWUtils || {};
window.NWUtils.clamp = function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); };
window.NWUtils.randomBetween = function randomBetween(min, max) { return min + Math.random() * (max - min); };
window.NWUtils.formatNumber = function formatNumber(value) { return String(value); };
window.NWUtils.safeQuerySelector = function safeQuerySelector(selector, root = document) {
  try { return root.querySelector(selector); } catch (e) { return null; }
};

// Mobile performance mode: kept as a cached boolean refreshed on resize/orientation
// so the per-frame render code can branch without re-running matchMedia each frame.
window.PERF_MOBILE = false;
function refreshPerfMobile() {
  try {
    window.PERF_MOBILE =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;
  } catch (e) {
    window.PERF_MOBILE = false;
  }
}
refreshPerfMobile();
window.addEventListener('resize', refreshPerfMobile);
window.addEventListener('orientationchange', refreshPerfMobile);
