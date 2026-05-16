const scriptChunks = [
  "./core/storage.js",
  "./core/utils.js",
  "./ui/dom.js",
  "./ui/menu.js",
  "./features/audio.js",
  "./features/skinsData.js",
  "./core/state.js",
  "./features/achievements.js",
  "./ui/toast.js",
  "./core/constants.js",
  "./features/currencies.js",
  "./features/skins.js",
  "./ui/panels.js",
  "./features/settings.js",
  "./features/cheatCodes.js",
  "./features/shop.js",
  "./game/eventPhase.js",
  "./game/score.js",
  "./game/obstacles.js",
  "./game/collision.js",
  "./game/player.js",
  "./game/gameLoop.js",
  "./game/input.js",
  "./ui/fullscreen.js"
];

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(src, import.meta.url).href;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load game script: ${src}`));
    document.head.appendChild(script);
  });
}

for (const chunk of scriptChunks) {
  await loadClassicScript(chunk);
}

window.NWCheatCodes?.initCheatCodes?.();
