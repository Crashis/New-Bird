window.NWUtils = window.NWUtils || {};
window.NWUtils.clamp = function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); };
window.NWUtils.randomBetween = function randomBetween(min, max) { return min + Math.random() * (max - min); };
window.NWUtils.formatNumber = function formatNumber(value) { return String(value); };
window.NWUtils.safeQuerySelector = function safeQuerySelector(selector, root = document) {
  try { return root.querySelector(selector); } catch (e) { return null; }
};
