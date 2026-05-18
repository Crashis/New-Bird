(function initProgressSnapshot(global) {
  const NS = (global.NWStorage = global.NWStorage || {});
  const KEYS = NS.PROGRESS_KEYS || {};

  function readNum(key, fallback = 0) {
    try {
      const raw = global.localStorage.getItem(key);
      const v = parseInt(raw == null ? '' : raw, 10);
      return Number.isFinite(v) && v >= 0 ? v : fallback;
    } catch (e) { return fallback; }
  }
  function readBool(key) {
    try { return global.localStorage.getItem(key) === '1'; } catch (e) { return false; }
  }
  function readStr(key, fallback = '') {
    try { return global.localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function readJson(key, fallback) {
    try {
      const raw = global.localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) { return fallback; }
  }

  function readLocalProgressSnapshot() {
    const skinsRaw = readJson(KEYS.UNLOCKED_SKINS, []);
    const ownedSkins = Array.isArray(skinsRaw) ? skinsRaw.filter(s => typeof s === 'string') : [];
    const achievementsRaw = readJson(KEYS.ACHIEVEMENTS, {});
    const achievements = (achievementsRaw && typeof achievementsRaw === 'object' && !Array.isArray(achievementsRaw)) ? achievementsRaw : {};
    const playerUpgradesRaw = readJson(KEYS.PLAYER_UPGRADES, {});
    const playerUpgrades = (playerUpgradesRaw && typeof playerUpgradesRaw === 'object' && !Array.isArray(playerUpgradesRaw)) ? playerUpgradesRaw : {};
    return {
      bestScore: readNum(KEYS.BEST),
      yang: readNum(KEYS.YANG),
      wallets: readNum(KEYS.WALLETS),
      dragonCoins: readNum(KEYS.DRAGON_COINS),
      errCubes: readNum(KEYS.ERR_CUBES),
      upgrades: {
        shieldStart: readBool(KEYS.UPGRADE_SHIELD_START),
        invincibility: readNum(KEYS.UPGRADE_INVINCIBILITY),
        doubleYang: readNum(KEYS.UPGRADE_DOUBLE_YANG),
        crownBonus: readNum(KEYS.UPGRADE_CROWN_BONUS),
        maxShields2: readBool(KEYS.UPGRADE_MAX_SHIELDS_2),
        immortalityUses: readNum(KEYS.IMMORTALITY_USES),
        player: playerUpgrades
      },
      selectedSkin: readStr(KEYS.SELECTED_SKIN, ''),
      ownedSkins,
      ownedTrails: (function(){ const v = readJson(KEYS.UNLOCKED_TRAILS, []); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; })(),
      selectedTrail: readStr(KEYS.SELECTED_TRAIL, ''),
      selectedTrailColor: readStr(KEYS.SELECTED_TRAIL_COLOR, ''),
      ownedSpecials: (function(){ const v = readJson(KEYS.UNLOCKED_SPECIALS, []); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; })(),
      selectedSpecials: (function(){ const v = readJson(KEYS.SELECTED_SPECIALS, []); return Array.isArray(v) ? v.filter(s => typeof s === 'string') : []; })(),
      achievements,
      heirlooms: {
        rocketPurchased: readBool(KEYS.HEIRLOOM_ROCKET_PURCHASED),
        rocketEquipped: readBool(KEYS.HEIRLOOM_ROCKET_EQUIPPED),
        potionPurchased: readBool(KEYS.HEIRLOOM_POTION_PURCHASED),
        potionEquipped: readBool(KEYS.HEIRLOOM_POTION_EQUIPPED),
        godiasPurchased: readBool(KEYS.HEIRLOOM_GODIAS_PURCHASED),
        godiasEquipped: readBool(KEYS.HEIRLOOM_GODIAS_EQUIPPED),
        concertPurchased: readBool(KEYS.HEIRLOOM_CONCERT_PURCHASED),
        paysafePurchased: readBool(KEYS.HEIRLOOM_PAYSAFE_PURCHASED),
        neschopenkaPurchased: readBool(KEYS.HEIRLOOM_NESCHOPENKA_PURCHASED)
      },
      boss: {
        bezosTicketUnlocked: readBool(KEYS.BEZOS_BOSS_TICKET),
        bezosLastWinDate: readStr(KEYS.BEZOS_BOSS_LAST_WIN),
        bezosBonusUsedDate: readStr(KEYS.BEZOS_BOSS_BONUS_USED)
      },
      dungeons: {
        dragonEggDate: readStr(KEYS.DRAGON_EGG_DATE),
        dragonEggUses: readNum(KEYS.DRAGON_EGG_USES),
        dragonEggState: readJson(KEYS.DRAGON_EGG_STATE, null),
        blacksmithDate: readStr(KEYS.BLACKSMITH_DATE),
        blacksmithPlays: readNum(KEYS.BLACKSMITH_PLAYS),
        threeChestsDate: readStr(KEYS.THREE_CHESTS_DATE),
        wheelDate: readStr(KEYS.WHEEL_DATE)
      },
      nickname: readStr(KEYS.PLAYER_NAME)
    };
  }

  function sanitNum(v, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
    let n;
    if (typeof v === 'number' && Number.isFinite(v)) n = v;
    else if (typeof v === 'string') n = parseInt(v, 10);
    else n = NaN;
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(n)));
  }
  function sanitBool(v) { return v === true || v === '1' || v === 1; }
  function sanitStr(v, fallback = '') { return typeof v === 'string' ? v : fallback; }
  function sanitObj(v, fallback) { return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback; }
  function sanitArr(v, fallback) { return Array.isArray(v) ? v : fallback; }

  function normalizeProgressSnapshot(input) {
    const i = input && typeof input === 'object' ? input : {};
    const u = i.upgrades || {};
    const h = i.heirlooms || {};
    const b = i.boss || {};
    const d = i.dungeons || {};
    return {
      bestScore: sanitNum(i.bestScore, 0, 0, 100000),
      yang: sanitNum(i.yang, 0),
      wallets: sanitNum(i.wallets, 0),
      dragonCoins: sanitNum(i.dragonCoins, 0),
      errCubes: sanitNum(i.errCubes, 0),
      upgrades: {
        shieldStart: sanitBool(u.shieldStart),
        invincibility: sanitNum(u.invincibility, 0, 0, 99),
        doubleYang: sanitNum(u.doubleYang, 0, 0, 99),
        crownBonus: sanitNum(u.crownBonus, 0, 0, 99),
        maxShields2: sanitBool(u.maxShields2),
        immortalityUses: sanitNum(u.immortalityUses, 0),
        player: sanitObj(u.player, {})
      },
      selectedSkin: sanitStr(i.selectedSkin, ''),
      ownedSkins: sanitArr(i.ownedSkins, []).filter(s => typeof s === 'string'),
      ownedTrails: sanitArr(i.ownedTrails, []).filter(s => typeof s === 'string'),
      selectedTrail: sanitStr(i.selectedTrail, ''),
      selectedTrailColor: (function(){ const c = sanitStr(i.selectedTrailColor, ''); return /^#[0-9a-fA-F]{6}$/.test(c) ? c : ''; })(),
      ownedSpecials: sanitArr(i.ownedSpecials, []).filter(s => typeof s === 'string'),
      selectedSpecials: sanitArr(i.selectedSpecials, []).filter(s => typeof s === 'string'),
      achievements: sanitObj(i.achievements, {}),
      heirlooms: {
        rocketPurchased: sanitBool(h.rocketPurchased),
        rocketEquipped: sanitBool(h.rocketEquipped),
        potionPurchased: sanitBool(h.potionPurchased),
        potionEquipped: sanitBool(h.potionEquipped),
        godiasPurchased: sanitBool(h.godiasPurchased),
        godiasEquipped: sanitBool(h.godiasEquipped),
        concertPurchased: sanitBool(h.concertPurchased),
        paysafePurchased: sanitBool(h.paysafePurchased),
        neschopenkaPurchased: sanitBool(h.neschopenkaPurchased)
      },
      boss: {
        bezosTicketUnlocked: sanitBool(b.bezosTicketUnlocked),
        bezosLastWinDate: sanitStr(b.bezosLastWinDate, ''),
        bezosBonusUsedDate: sanitStr(b.bezosBonusUsedDate, '')
      },
      dungeons: {
        dragonEggDate: sanitStr(d.dragonEggDate, ''),
        dragonEggUses: sanitNum(d.dragonEggUses, 0),
        dragonEggState: sanitObj(d.dragonEggState, null),
        blacksmithDate: sanitStr(d.blacksmithDate, ''),
        blacksmithPlays: sanitNum(d.blacksmithPlays, 0),
        threeChestsDate: sanitStr(d.threeChestsDate, ''),
        wheelDate: sanitStr(d.wheelDate, '')
      },
      nickname: sanitStr(i.nickname, '').slice(0, 20)
    };
  }

  function writeNum(key, v) { try { global.localStorage.setItem(key, String(Math.max(0, Math.floor(Number(v) || 0)))); } catch(e){} }
  function writeBool(key, v) { try { global.localStorage.setItem(key, v ? '1' : '0'); } catch(e){} }
  function writeStr(key, v) { try { global.localStorage.setItem(key, String(v||'')); } catch(e){} }
  function writeJson(key, v) { try { global.localStorage.setItem(key, JSON.stringify(v)); } catch(e){} }

  function applyProgressSnapshotToLocalStorage(rawSnapshot) {
    const s = normalizeProgressSnapshot(rawSnapshot);
    writeNum(KEYS.BEST, s.bestScore);
    writeNum(KEYS.YANG, s.yang);
    writeNum(KEYS.WALLETS, s.wallets);
    writeNum(KEYS.DRAGON_COINS, s.dragonCoins);
    writeNum(KEYS.ERR_CUBES, s.errCubes);
    writeBool(KEYS.UPGRADE_SHIELD_START, s.upgrades.shieldStart);
    writeNum(KEYS.UPGRADE_INVINCIBILITY, s.upgrades.invincibility);
    writeNum(KEYS.UPGRADE_DOUBLE_YANG, s.upgrades.doubleYang);
    writeNum(KEYS.UPGRADE_CROWN_BONUS, s.upgrades.crownBonus);
    writeBool(KEYS.UPGRADE_MAX_SHIELDS_2, s.upgrades.maxShields2);
    writeNum(KEYS.IMMORTALITY_USES, s.upgrades.immortalityUses);
    writeJson(KEYS.PLAYER_UPGRADES, s.upgrades.player);
    writeStr(KEYS.SELECTED_SKIN, s.selectedSkin);
    writeJson(KEYS.UNLOCKED_SKINS, s.ownedSkins);
    writeJson(KEYS.ACHIEVEMENTS, s.achievements);
    writeBool(KEYS.HEIRLOOM_ROCKET_PURCHASED, s.heirlooms.rocketPurchased);
    writeBool(KEYS.HEIRLOOM_ROCKET_EQUIPPED, s.heirlooms.rocketEquipped);
    writeBool(KEYS.HEIRLOOM_POTION_PURCHASED, s.heirlooms.potionPurchased);
    writeBool(KEYS.HEIRLOOM_POTION_EQUIPPED, s.heirlooms.potionEquipped);
    writeBool(KEYS.HEIRLOOM_GODIAS_PURCHASED, s.heirlooms.godiasPurchased);
    writeBool(KEYS.HEIRLOOM_GODIAS_EQUIPPED, s.heirlooms.godiasEquipped);
    writeBool(KEYS.HEIRLOOM_CONCERT_PURCHASED, s.heirlooms.concertPurchased);
    writeBool(KEYS.HEIRLOOM_PAYSAFE_PURCHASED, s.heirlooms.paysafePurchased);
    writeBool(KEYS.HEIRLOOM_NESCHOPENKA_PURCHASED, s.heirlooms.neschopenkaPurchased);
    writeBool(KEYS.BEZOS_BOSS_TICKET, s.boss.bezosTicketUnlocked);
    writeStr(KEYS.BEZOS_BOSS_LAST_WIN, s.boss.bezosLastWinDate);
    writeStr(KEYS.BEZOS_BOSS_BONUS_USED, s.boss.bezosBonusUsedDate);
    writeStr(KEYS.DRAGON_EGG_DATE, s.dungeons.dragonEggDate);
    writeNum(KEYS.DRAGON_EGG_USES, s.dungeons.dragonEggUses);
    if (s.dungeons.dragonEggState) writeJson(KEYS.DRAGON_EGG_STATE, s.dungeons.dragonEggState);
    else { try { global.localStorage.removeItem(KEYS.DRAGON_EGG_STATE); } catch(e){} }
    writeStr(KEYS.BLACKSMITH_DATE, s.dungeons.blacksmithDate);
    writeNum(KEYS.BLACKSMITH_PLAYS, s.dungeons.blacksmithPlays);
    writeStr(KEYS.THREE_CHESTS_DATE, s.dungeons.threeChestsDate);
    writeStr(KEYS.WHEEL_DATE, s.dungeons.wheelDate);
    if (s.nickname) writeStr(KEYS.PLAYER_NAME, s.nickname);
    writeJson(KEYS.UNLOCKED_TRAILS, s.ownedTrails);
    if (s.selectedTrail) writeStr(KEYS.SELECTED_TRAIL, s.selectedTrail); else { try { global.localStorage.removeItem(KEYS.SELECTED_TRAIL); } catch(e){} }
    if (s.selectedTrailColor) writeStr(KEYS.SELECTED_TRAIL_COLOR, s.selectedTrailColor);
    writeJson(KEYS.UNLOCKED_SPECIALS, s.ownedSpecials);
    writeJson(KEYS.SELECTED_SPECIALS, s.selectedSpecials);
  }

  function isLocalProgressMeaningful(snap) {
    if (!snap || typeof snap !== 'object') return false;
    if ((snap.bestScore || 0) > 0) return true;
    if ((snap.yang || 0) > 0) return true;
    if ((snap.wallets || 0) > 0) return true;
    if ((snap.dragonCoins || 0) > 0) return true;
    if ((snap.errCubes || 0) > 0) return true;
    if (Array.isArray(snap.ownedSkins) && snap.ownedSkins.length > 0) return true;
    if (snap.achievements && Object.keys(snap.achievements).length > 0) return true;
    if (snap.heirlooms && Object.values(snap.heirlooms).some(v => v === true)) return true;
    if (snap.upgrades && (snap.upgrades.shieldStart || snap.upgrades.invincibility > 0 || snap.upgrades.doubleYang > 0 || snap.upgrades.crownBonus > 0 || snap.upgrades.maxShields2)) return true;
    if (Array.isArray(snap.ownedTrails) && snap.ownedTrails.length > 0) return true;
    if (Array.isArray(snap.ownedSpecials) && snap.ownedSpecials.length > 0) return true;
    return false;
  }

  function summarizeProgressSnapshot(snap) {
    const s = snap || {};
    const heirloomCount = s.heirlooms ? Object.entries(s.heirlooms).filter(([k, v]) => /Purchased$/.test(k) && v === true).length : 0;
    return {
      bestScore: s.bestScore || 0,
      yang: s.yang || 0,
      wallets: s.wallets || 0,
      dragonCoins: s.dragonCoins || 0,
      errCubes: s.errCubes || 0,
      skinCount: Array.isArray(s.ownedSkins) ? s.ownedSkins.length : 0,
      achievementCount: s.achievements ? Object.keys(s.achievements).length : 0,
      heirloomCount
    };
  }

  function compareProgressSnapshots(a, b) {
    const sa = summarizeProgressSnapshot(a);
    const sb = summarizeProgressSnapshot(b);
    if (sa.bestScore > sb.bestScore) return 'a';
    if (sb.bestScore > sa.bestScore) return 'b';
    if (sa.skinCount > sb.skinCount) return 'a';
    if (sb.skinCount > sa.skinCount) return 'b';
    if (sa.achievementCount > sb.achievementCount) return 'a';
    if (sb.achievementCount > sa.achievementCount) return 'b';
    if (sa.yang > sb.yang) return 'a';
    if (sb.yang > sa.yang) return 'b';
    return 'equal';
  }

  function createDefaultProgressSnapshot() {
    return normalizeProgressSnapshot({});
  }

  function resetLocalProgressToDefaults() {
    const list = (global.NWStorage && global.NWStorage.PROGRESS_KEY_LIST) || [];
    for (const key of list) {
      try { global.localStorage.removeItem(key); } catch (e) {}
    }
    // Also clear the migration dismissed flag so the cloud-save flow restarts cleanly.
    try { global.localStorage.removeItem('cloudSaveMigrationDismissed'); } catch (e) {}
  }

  global.NWProgressSnapshot = {
    readLocalProgressSnapshot,
    normalizeProgressSnapshot,
    applyProgressSnapshotToLocalStorage,
    isLocalProgressMeaningful,
    summarizeProgressSnapshot,
    compareProgressSnapshots,
    createDefaultProgressSnapshot,
    resetLocalProgressToDefaults
  };
})(typeof window !== 'undefined' ? window : globalThis);
