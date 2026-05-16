// Shared localStorage helpers for future modules. Existing game keys stay unchanged in state.js for compatibility.
window.NWStorage = window.NWStorage || {};
window.NWStorage.STORAGE_KEYS = {
  BEST: 'nw_flappy_best',
  YANG: 'nw_flappy_yang',
  WALLETS: 'nw_flappy_wallets',
  UPGRADE_SHIELD_START: 'nw_flappy_upgrade_shield_start',
  UPGRADE_INVINCIBILITY: 'nw_flappy_upgrade_invincibility',
  UPGRADE_DOUBLE_YANG: 'nw_flappy_upgrade_double_yang',
  UPGRADE_CROWN_BONUS: 'nw_flappy_upgrade_crown_bonus',
  SELECTED_SKIN: 'nw_flappy_selected_skin',
  ACHIEVEMENTS: 'nw_flappy_achievements',
  IMMORTALITY_USES: 'nw_flappy_immortality_uses',
  SETTINGS_SFX: 'nw_flappy_settings_sfx',
  SETTINGS_MUSIC: 'nw_flappy_settings_music',
  SETTINGS_VOICE_LINES: 'nw_flappy_settings_voice_lines',
  SETTINGS_EFFECTS: 'nw_flappy_settings_effects'
};
window.NWStorage.loadJson = function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};
window.NWStorage.saveJson = function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
};
window.NWStorage.loadNumber = function loadNumber(key, fallback = 0) {
  try {
    const value = parseInt(localStorage.getItem(key) || String(fallback), 10);
    return Number.isFinite(value) ? value : fallback;
  } catch (e) {
    return fallback;
  }
};
window.NWStorage.saveNumber = function saveNumber(key, value) {
  try { localStorage.setItem(key, String(value)); } catch (e) {}
};
