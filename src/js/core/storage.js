// Shared localStorage helpers for future modules. Existing game keys stay unchanged in state.js for compatibility.
window.NWStorage = window.NWStorage || {};
window.NWStorage.STORAGE_KEYS = {
  BEST: 'nw_flappy_best',
  YANG: 'nw_flappy_yang',
  WALLETS: 'nw_flappy_wallets',
  ERR_CUBES: 'nw_flappy_err_cubes',
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

window.NWStorage.PROGRESS_KEYS = Object.freeze({
  // Currencies
  BEST: 'nw_flappy_best',
  YANG: 'nw_flappy_yang',
  WALLETS: 'nw_flappy_wallets',
  DRAGON_COINS: 'nw_flappy_dragon_coins',
  ERR_CUBES: 'nw_flappy_err_cubes',
  // Upgrades
  UPGRADE_SHIELD_START: 'nw_flappy_upgrade_shield_start',
  UPGRADE_INVINCIBILITY: 'nw_flappy_upgrade_invincibility',
  UPGRADE_DOUBLE_YANG: 'nw_flappy_upgrade_double_yang',
  UPGRADE_CROWN_BONUS: 'nw_flappy_upgrade_crown_bonus',
  UPGRADE_MAX_SHIELDS_2: 'nw_flappy_upgrade_max_shields_2',
  PLAYER_UPGRADES: 'nw_flappy_player_upgrades',
  IMMORTALITY_USES: 'nw_flappy_immortality_uses',
  // Skins
  SELECTED_SKIN: 'nw_flappy_selected_skin',
  UNLOCKED_SKINS: 'nw_flappy_unlocked_skins',
  // Achievements
  ACHIEVEMENTS: 'nw_flappy_achievements',
  // Heirlooms
  HEIRLOOM_ROCKET_PURCHASED: 'heirloomRocketPurchased',
  HEIRLOOM_ROCKET_EQUIPPED: 'heirloomRocketEquipped',
  HEIRLOOM_POTION_PURCHASED: 'heirloomPotionPurchased',
  HEIRLOOM_POTION_EQUIPPED: 'heirloomPotionEquipped',
  HEIRLOOM_GODIAS_PURCHASED: 'heirloomGodiasPurchased',
  HEIRLOOM_GODIAS_EQUIPPED: 'heirloomGodiasEquipped',
  HEIRLOOM_CONCERT_PURCHASED: 'heirloomConcertPurchased',
  HEIRLOOM_PAYSAFE_PURCHASED: 'heirloomPaysafePurchased',
  HEIRLOOM_NESCHOPENKA_PURCHASED: 'heirloomNeschopenkaPurchased',
  // Boss / dungeon
  BEZOS_BOSS_TICKET: 'bezosBossTicketUnlocked',
  BEZOS_BOSS_LAST_WIN: 'bezosBossLastWinDate',
  BEZOS_BOSS_BONUS_USED: 'bezosBossBonusUsedDate',
  // Daily cooldowns
  DRAGON_EGG_DATE: 'dragonEggDailyDate',
  DRAGON_EGG_USES: 'dragonEggDailyUses',
  DRAGON_EGG_STATE: 'dragonEggState',
  BLACKSMITH_DATE: 'blacksmithChallengePlayDate',
  BLACKSMITH_PLAYS: 'blacksmithChallengePlaysToday',
  THREE_CHESTS_DATE: 'threeChestsLastPlayedDate',
  WHEEL_DATE: 'wheelOfFortuneLastPlayedDate',
  // Nickname
  PLAYER_NAME: 'nw_player_name'
});

window.NWStorage.PROGRESS_KEY_LIST = Object.values(window.NWStorage.PROGRESS_KEYS);
