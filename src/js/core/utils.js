window.NWUtils = window.NWUtils || {};
window.NWUtils.clamp = function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); };
window.NWUtils.randomBetween = function randomBetween(min, max) { return min + Math.random() * (max - min); };
window.NWUtils.formatNumber = function formatNumber(value) { return String(value); };
window.NWUtils.safeQuerySelector = function safeQuerySelector(selector, root = document) {
  try { return root.querySelector(selector); } catch (e) { return null; }
};

// Mobile performance mode: kept as a cached boolean refreshed on resize/orientation
// so the per-frame render code can branch without re-running matchMedia each frame.
// PERF_MOBILE is the OR of auto-detect (mobile viewport / coarse pointer) and the
// user-toggled Mobile Boost setting; render code reads only this single flag.
window.PERF_MOBILE = false;
window.PERF_MOBILE_AUTO = false;
window.MOBILE_BOOST = false;
function refreshPerfMobile() {
  try {
    window.PERF_MOBILE_AUTO =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches ||
      (window.matchMedia('(orientation: landscape)').matches && window.innerHeight <= 520);
  } catch (e) {
    window.PERF_MOBILE_AUTO = false;
  }
  window.PERF_MOBILE = window.PERF_MOBILE_AUTO || window.MOBILE_BOOST === true;
}
window.NWUtils.isMobileLandscape = function isMobileLandscape() {
  try {
    return window.matchMedia('(orientation: landscape)').matches &&
           (window.matchMedia('(pointer: coarse)').matches || window.innerHeight <= 520);
  } catch (e) { return false; }
};
window.NWUtils.refreshPerfMobile = refreshPerfMobile;
refreshPerfMobile();
window.addEventListener('resize', refreshPerfMobile);
window.addEventListener('orientationchange', refreshPerfMobile);
