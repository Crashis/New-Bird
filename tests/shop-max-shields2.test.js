const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const shopSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/shop.js'), 'utf8');
const currenciesSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/currencies.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function createElement() {
  return {
    textContent: '',
    disabled: false,
    classList: {
      values: new Set(),
      toggle(name, force) {
        if (force) this.values.add(name);
        else this.values.delete(name);
      }
    }
  };
}

function loadShopEnv(options = {}) {
  const store = new Map();
  const elements = {
    maxShields2Level: createElement(),
    buyMaxShields2Btn: createElement(),
    shopMessage: createElement()
  };
  const context = {
    console,
    localStorage: {
      setItem(key, value) {
        store.set(key, String(value));
      }
    },
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
      querySelectorAll() {
        return [];
      }
    },
    performance: { now() { return 0; } },
    t(key, values) {
      if (key === 'economy.owned') return 'Vlastnis';
      if (key === 'economy.notOwned') return 'Nevlastnis';
      if (key === 'economy.bought') return 'Koupeno';
      if (key === 'economy.buyFor') return `Koupit - ${values.cost} Yangu`;
      if (key === 'shop.maxShields2Bought') return 'Druhy stit koupen.';
      if (key === 'shop.maxShields2NotEnough') return 'Nedostatek men.';
      if (key === 'shop.noYangFor') return `Nemas dost Yangu (${values.cost}).`;
      return key;
    },
    checkAchievements() {},
    renderShellGamePanel() {},
    renderHeirloomPanel() {},
    renderUpgradesPanel() {},
    showUnlockToast() {},
    UPGRADE_LEVEL_COSTS: [100, 150, 200],
    INVINCIBLE_DURATION_MS: 2000,
    DOUBLE_YANG_BASE_MS: 8000,
    DOUBLE_YANG_BONUS_MS: 2000,
    DOUBLE_YANG_MAX_LEVEL: 2,
    CROWN_BONUS_BASE: 1,
    CROWN_BONUS_MAX_LEVEL: 2,
    POWERUP_TYPE_WEIGHTS: [['invincibility', 1]],
    yang: Number(options.yang || 0),
    wallets: Number(options.wallets || 0),
    dragonCoins: Number(options.dragonCoins || 0),
    errCubes: 0,
    shieldStartOwned: false,
    invincibilityLevel: 0,
    doubleYangLevel: 0,
    crownBonusLevel: 0,
    maxShields2Owned: false
  };
  context.saveEconomy = function saveEconomy() {
    store.set('nw_flappy_yang', String(context.yang));
    store.set('nw_flappy_wallets', String(context.wallets));
    store.set('nw_flappy_upgrade_max_shields_2', context.maxShields2Owned ? '1' : '0');
  };
  context.saveDragonCoins = function saveDragonCoins() {
    store.set('nw_flappy_dragon_coins', String(context.dragonCoins));
  };
  vm.createContext(context);
  vm.runInContext(currenciesSource, context);
  vm.runInContext(shopSource, context);
  return { context, elements, store };
}

function readGlobal(context, name) {
  return vm.runInContext(name, context);
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

test('second shield button requires 666 yangs, 6 wallets and 6 dragon coins', () => {
  const env = loadShopEnv({ yang: 666, wallets: 6, dragonCoins: 5 });

  env.context.updateEconomyUi();

  assert.strictEqual(env.elements.buyMaxShields2Btn.disabled, true);
  assert.match(env.elements.buyMaxShields2Btn.textContent, /666/);
  assert.match(env.elements.buyMaxShields2Btn.textContent, /6 Pen/);
  assert.match(env.elements.buyMaxShields2Btn.textContent, /6 Dra/);
});

test('buying second shield spends all three currencies atomically', () => {
  const env = loadShopEnv({ yang: 700, wallets: 7, dragonCoins: 6 });

  env.context.buyMaxShields2();

  assert.strictEqual(readGlobal(env.context, 'maxShields2Owned'), true);
  assert.strictEqual(readGlobal(env.context, 'yang'), 34);
  assert.strictEqual(readGlobal(env.context, 'wallets'), 1);
  assert.strictEqual(readGlobal(env.context, 'dragonCoins'), 0);
});

test('second shield markup advertises the combined price', () => {
  assert.match(indexSource, /666 Yang/);
  assert.match(indexSource, /6 Pen/);
  assert.match(indexSource, /6 Dra/);
});
