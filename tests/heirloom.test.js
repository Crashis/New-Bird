const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const heirloomSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/heirloom.js'), 'utf8');
const i18nSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/i18n.js'), 'utf8');

function createElement() {
  return {
    textContent: '',
    disabled: false,
    onclick: null,
    classList: {
      values: new Set(),
      toggle(name, force) {
        if (force) this.values.add(name);
        else this.values.delete(name);
      },
      remove(name) {
        this.values.delete(name);
      }
    }
  };
}

function loadHeirloom(options = {}) {
  const store = new Map(Object.entries(options.localStorage || {}));
  const elements = {
    heirloomRocketStatus: createElement(),
    toggleHeirloomRocketBtn: createElement(),
    heirloomDragonCoins: createElement(),
    heirloomRocketMessage: createElement()
  };
  const toastCalls = [];
  const drawnText = [];
  const context = {
    console,
    window: { PERF_MOBILE: false },
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      }
    },
    document: {
      getElementById(id) {
        return elements[id] || null;
      }
    },
    performance: {
      now() { return 1000; }
    },
    t(key) {
      return {
        'toast.rocketRestored.title': 'ROCKET RESTORED',
        'toast.rocketRestored.subtitle': 'Ammo restored',
        'toast.noRocketAmmo.subtitle': 'No ammo',
        'heirloom.rocket.notEnough': 'Not enough Yangs or Dragon Coins.',
        'heirloom.rocket.unlocked': 'Rocket Launcher unlocked.',
        'heirloom.rocket.description': 'Right-click to fire.',
        'heirloom.rocket.locked': 'Locked',
        'heirloom.rocket.unlock': 'Unlock for 1000 Yangs + 10 Dragon Coins',
        'heirloom.rocket.equipped': 'Equipped',
        'heirloom.rocket.unequipped': 'Unequipped',
        'heirloom.rocket.equipAction': 'Equip',
        'heirloom.rocket.unequipAction': 'Unequip',
        'hud.rocket': 'Rocket'
      }[key] || key;
    },
    showUnlockToast(...args) {
      toastCalls.push(args);
    },
    updateEconomyUiCalls: 0,
    updateEconomyUi() {
      context.updateEconomyUiCalls++;
    },
    gameState: 'playing',
    isBlockingModalOpen() {
      return false;
    },
    activeVoiceLine: null,
    activeVoiceLineUntil: 0,
    score: 0,
    pipes: [{ x: 220, destroyed: false, gapTop: 100, gap: 160 }],
    PIPE_WIDTH: 80,
    player: { x: 160, y: 390, r: 38 },
    settings: { effects: false },
    particles: [],
    canvas: { width: 1200, height: 780 },
    ctx: {
      save() {},
      restore() {},
      beginPath() {},
      arc() {},
      fill() {},
      fillRect() {},
      fillText(text) {
        drawnText.push(text);
      },
      set fillStyle(value) {},
      set font(value) {},
      set textAlign(value) {},
      set textBaseline(value) {},
      set shadowBlur(value) {},
      set globalAlpha(value) {}
    }
  };

  vm.createContext(context);
  vm.runInContext(`
    var HEIRLOOM_ROCKET_PURCHASED_KEY = 'heirloomRocketPurchased';
    var yang = ${Number(options.yang || 0)};
    var dragonCoins = ${Number(options.dragonCoins || 0)};
    function getDragonCoins() { return dragonCoins; }
    function spendDragonCoins(amount) {
      if (dragonCoins < amount) return false;
      dragonCoins -= amount;
      localStorage.setItem('nw_flappy_dragon_coins', String(dragonCoins));
      return true;
    }
    function spendYang(amount) {
      if (yang < amount) return false;
      yang -= amount;
      localStorage.setItem('nw_flappy_yang', String(yang));
      return true;
    }
    function saveEconomy() {
      localStorage.setItem('nw_flappy_yang', String(yang));
    }
  `, context);
  vm.runInContext(heirloomSource, context);
  return {
    context,
    store,
    elements,
    toastCalls,
    drawnText,
    get yang() {
      return vm.runInContext('yang', context);
    },
    get dragonCoins() {
      return vm.runInContext('dragonCoins', context);
    }
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('new player starts locked and unequipped with no ammo HUD or rocket fire', () => {
  const env = loadHeirloom();
  assert.strictEqual(env.context.isHeirloomRocketPurchased(), false);
  assert.strictEqual(env.context.isRocketLauncherEquipped(), false);
  env.context.resetRocketRunState();
  env.context.drawRocketHud();
  env.context.fireRocket();
  assert.deepStrictEqual(env.drawnText, []);
  assert.strictEqual(vm.runInContext('rockets.length', env.context), 0);
});

test('stale equipped=true cannot bypass missing purchase and is migrated back to false', () => {
  const env = loadHeirloom({
    localStorage: { heirloomRocketEquipped: '1' }
  });
  assert.strictEqual(env.context.isHeirloomRocketPurchased(), false);
  assert.strictEqual(env.context.isRocketLauncherEquipped(), false);
  assert.strictEqual(env.store.get('heirloomRocketEquipped'), '0');
});

test('purchase is atomic when Yangs are missing', () => {
  const env = loadHeirloom({ yang: 999, dragonCoins: 10 });
  env.context.purchaseHeirloomRocket();
  assert.strictEqual(env.context.isHeirloomRocketPurchased(), false);
  assert.strictEqual(env.context.isRocketLauncherEquipped(), false);
  assert.strictEqual(env.yang, 999);
  assert.strictEqual(env.dragonCoins, 10);
  assert.strictEqual(env.elements.heirloomRocketMessage.textContent, 'Not enough Yangs or Dragon Coins.');
});

test('purchase is atomic when Dragon Coins are missing', () => {
  const env = loadHeirloom({ yang: 1000, dragonCoins: 9 });
  env.context.purchaseHeirloomRocket();
  assert.strictEqual(env.context.isHeirloomRocketPurchased(), false);
  assert.strictEqual(env.context.isRocketLauncherEquipped(), false);
  assert.strictEqual(env.yang, 1000);
  assert.strictEqual(env.dragonCoins, 9);
  assert.strictEqual(env.elements.heirloomRocketMessage.textContent, 'Not enough Yangs or Dragon Coins.');
});

test('successful purchase spends exactly 1000 Yangs and 10 Dragon Coins, persists and equips', () => {
  const env = loadHeirloom({ yang: 1000, dragonCoins: 10 });
  env.context.purchaseHeirloomRocket();
  assert.strictEqual(env.yang, 0);
  assert.strictEqual(env.dragonCoins, 0);
  assert.strictEqual(env.store.get('heirloomRocketPurchased'), '1');
  assert.strictEqual(env.store.get('heirloomRocketEquipped'), '1');
  assert.strictEqual(env.context.isHeirloomRocketPurchased(), true);
  assert.strictEqual(env.context.isRocketLauncherEquipped(), true);
});

test('equipped=false after purchase disables rocket use', () => {
  const env = loadHeirloom({
    localStorage: {
      heirloomRocketPurchased: '1',
      heirloomRocketEquipped: '0'
    },
    yang: 2000,
    dragonCoins: 20
  });
  assert.strictEqual(env.context.isRocketLauncherEquipped(), false);
  env.context.resetRocketRunState();
  env.context.fireRocket();
  assert.strictEqual(vm.runInContext('rockets.length', env.context), 0);
});

test('purchased=true and equipped=true keeps rocket fire working', () => {
  const env = loadHeirloom({
    localStorage: {
      heirloomRocketPurchased: '1',
      heirloomRocketEquipped: '1'
    }
  });
  env.context.resetRocketRunState();
  env.context.fireRocket();
  assert.strictEqual(vm.runInContext('rockets.length', env.context), 1);
});

test('heirloom i18n contains the combined Yang and Dragon Coin price', () => {
  assert.match(i18nSource, /Cena: 1000 Yangů \+ 10 Dračích mincí/);
  assert.match(i18nSource, /Price: 1000 Yangs \+ 10 Dragon Coins/);
  assert.match(i18nSource, /Nemáš dost Yangů nebo Dračích mincí\./);
  assert.match(i18nSource, /Not enough Yangs or Dragon Coins\./);
});
