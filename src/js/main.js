const scriptChunks = [
  "./src/js/core/i18n.js",
  "./src/js/core/storage.js",
  "./src/js/core/utils.js",
  "./src/js/ui/dom.js",
  "./src/js/ui/menu.js",
  "./src/js/features/audio.js",
  "./src/js/features/skinsData.js",
  "./src/js/core/state.js",
  "./src/js/features/achievements.js",
  "./src/js/ui/toast.js",
  "./src/js/core/constants.js",
  "./src/js/features/currencies.js",
  "./src/js/features/skins.js",
  "./src/js/ui/panels.js",
  "./src/js/features/settings.js",
  "./src/js/features/cheatCodes.js",
  "./src/js/features/shop.js",
  "./src/js/features/heirloom.js",
  "./src/js/features/shellGame.js",
  "./src/js/game/eventPhase.js",
  "./src/js/game/score.js",
  "./src/js/game/obstacles.js",
  "./src/js/game/collision.js",
  "./src/js/game/player.js",
  "./src/js/game/gameLoop.js",
  "./src/js/game/input.js",
  "./src/js/ui/fullscreen.js"
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
