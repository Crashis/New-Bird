const scriptChunks = [
  "./src/js/core/i18n.js",
  "./src/js/core/storage.js",
  "./src/js/features/progressSnapshot.js",
  "./src/js/features/progressReset.js",
  "./src/js/features/cloudMigration.js",
  "./src/js/core/utils.js",
  "./src/js/ui/dom.js",
  "./src/js/ui/menu.js",
  "./src/js/features/skinsData.js",
  "./src/js/core/constants.js",
  "./src/js/core/state.js",
  "./src/js/features/audio.js",
  "./src/js/features/achievements.js",
  "./src/js/ui/toast.js",
  "./src/js/features/currencies.js",
  "./src/js/features/trails.js",
  "./src/js/features/specials.js",
  "./src/js/features/skins.js",
  "./src/js/features/leaderboard.js",
  "./src/js/ui/panels.js",
  "./src/js/features/settings.js",
  "./src/js/features/cheatCodes.js",
  "./src/js/features/shop.js",
  "./src/js/features/heirloom.js",
  "./src/js/features/upgrades.js",
  "./src/js/features/shellGame.js",
  "./src/js/features/threeChests.js",
  "./src/js/features/dragonDice.js",
  "./src/js/features/drunkArcher.js",
  "./src/js/features/pirateMap.js",
  "./src/js/features/dragonEgg.js",
  "./src/js/features/blacksmith.js",
  "./src/js/features/wheelOfFortune.js",
  "./src/js/features/share.js",
  "./src/js/game/eventPhase.js",
  "./src/js/game/score.js",
  "./src/js/game/obstacles.js",
  "./src/js/game/collision.js",
  "./src/js/game/player.js",
  "./src/js/game/gameLoop.js",
  "./src/js/game/bossFight.js",
  "./src/js/game/input.js",
  "./src/js/ui/fullscreen.js",
  "./src/js/features/pwaInstall.js"
];

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.setAttribute('src', src);
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load game script: ${src}`));
    document.head.appendChild(script);
  });
}

for (const chunk of scriptChunks) {
  await loadClassicScript(chunk);
}

window.NWI18n?.initI18n?.();
window.NWCheatCodes?.initCheatCodes?.();
if (typeof initShellGameDefaults === 'function') initShellGameDefaults();
if (typeof updateEconomyUi === 'function') updateEconomyUi();

(async () => {
  try {
    const firebaseLeaderboard = await import("./features/firebaseLeaderboard.js");
    const uid = await firebaseLeaderboard.initLeaderboardAuth();
    if (!uid) return;

    const cloudSaveModule = await import("./features/cloudSave.js");
    const initOk = cloudSaveModule.initCloudSave({ uid });
    if (!initOk) return;

    try {
      const googleAuthModule = await import("./features/googleAuth.js");
      googleAuthModule.initGoogleAuth();
    } catch (e) {
      console.warn('[googleAuth] module failed to load', e);
    }

    const cloudExists = await cloudSaveModule.hasCloudSave();
    const localSnap = (window.NWProgressSnapshot && window.NWProgressSnapshot.readLocalProgressSnapshot())
      || null;
    const hasLocal = !!(window.NWProgressSnapshot && window.NWProgressSnapshot.isLocalProgressMeaningful(localSnap));
    const decision = window.NWCloudMigration.decideMigrationAction({
      firebaseAvailable: true,
      hasLocal,
      hasCloud: cloudExists,
      migrationDismissed: window.NWCloudMigration.wasMigrationDismissed()
    });

    console.log('[cloudSave] migration decision', {
      uidExists: !!uid,
      cloudExists,
      localMeaningful: hasLocal,
      decision: decision.action,
      reason: decision.reason
    });

    if (decision.action === 'noop') return;

    let cloudSnap = null;
    if (decision.action !== 'prompt-upload') {
      cloudSnap = await cloudSaveModule.loadCloudProgress();
    }

    const localSummary = hasLocal && window.NWProgressSnapshot
      ? window.NWProgressSnapshot.summarizeProgressSnapshot(localSnap)
      : null;
    const cloudSummary = cloudSnap && window.NWProgressSnapshot
      ? window.NWProgressSnapshot.summarizeProgressSnapshot(cloudSnap)
      : null;

    window.NWCloudMigration.openMigrationDialog({
      action: decision.action,
      localSummary,
      cloudSummary,
      onChoice: async (choice) => {
        try {
          if (choice === 'upload') {
            await cloudSaveModule.uploadLocalProgressToCloud('migration-accept');
            window.NWCloudMigration.clearMigrationDismissed();
          } else if (choice === 'download') {
            const ok = await cloudSaveModule.downloadCloudProgressToLocal();
            if (ok) window.location.reload();
          } else if (choice === 'dismiss') {
            window.NWCloudMigration.markMigrationDismissed();
          }
        } catch (error) {
          console.warn('[cloudSave] migration choice failed', error);
        }
      }
    });
  } catch (error) {
    console.warn('[leaderboard] Firebase module failed to load; online features disabled', error);
  }
})();
