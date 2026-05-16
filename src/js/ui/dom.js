window.NWDom = window.NWDom || {};
window.NWDom.refs = {};
window.NWDom.initDomRefs = function initDomRefs() {
  const ids = ['gameCanvas', 'startBtn', 'menuShopBtn', 'menuSkinsBtn', 'menuSettingsBtn', 'menuCheatBtn', 'menuAchievementsBtn', 'fullscreenBtn', 'gameOverlay', 'startPanel', 'shopPanel', 'skinsPanel', 'settingsPanel', 'cheatCodesPanel', 'achievementsPanel', 'unlockToast'];
  for (const id of ids) window.NWDom.refs[id] = document.getElementById(id);
  return window.NWDom.refs;
};
window.NWDom.initDomRefs();
