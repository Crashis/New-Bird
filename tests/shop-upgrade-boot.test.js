const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const mainSource = fs.readFileSync(path.join(repoRoot, 'src/js/main.js'), 'utf8');
const constantsSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/constants.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/state.js'), 'utf8');
const upgradesSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/upgrades.js'), 'utf8');

function createMockStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    get _data() { return data; }
  };
}

function createBaseContext(initialStorage = {}) {
  const storage = createMockStorage(initialStorage);
  const ctx = {
    window: {},
    localStorage: storage,
    document: {
      body: { classList: { toggle() {} } },
      addEventListener() {},
      getElementById() { return null; }
    },
    console: { warn() {}, log() {}, error() {} },
    performance: { now() { return 0; } },
    JSON,
    SKINS: [{ id: 'godias-zubaty', unlocked: true }],
    TRAILS: [],
    SPECIALS: [],
    ACHIEVEMENTS: [],
    ACHIEVEMENT_STORAGE_KEY: 'nw_flappy_achievements',
    IMMORTALITY_USES_KEY: 'nw_flappy_immortality_uses',
    TRAIL_DEFAULT_COLOR: '#ffffff'
  };
  ctx.window.localStorage = storage;
  ctx.window.NWUtils = { refreshPerfMobile() {} };
  vm.createContext(ctx);
  return { ctx, storage };
}

function test(name, fn) {
  try { fn(); console.log(`ok - ${name}`); }
  catch (e) { console.error(`not ok - ${name}`); throw e; }
}

test('boot script loads constants before state so saved shop upgrade levels can initialize', () => {
  const constantsIndex = mainSource.indexOf('"./src/js/core/constants.js"');
  const stateIndex = mainSource.indexOf('"./src/js/core/state.js"');

  assert.ok(constantsIndex >= 0, 'main.js should load constants.js');
  assert.ok(stateIndex >= 0, 'main.js should load state.js');
  assert.ok(constantsIndex < stateIndex, 'constants.js must load before state.js');
});

test('state init restores saved legacy shop upgrade levels when constants are available', () => {
  const { ctx } = createBaseContext({
    nw_flappy_upgrade_invincibility: '4',
    nw_flappy_upgrade_double_yang: '5',
    nw_flappy_upgrade_crown_bonus: '3',
    nw_flappy_upgrade_max_shields_2: '1'
  });

  vm.runInContext(constantsSource, ctx);
  vm.runInContext(stateSource, ctx);

  assert.strictEqual(vm.runInContext('invincibilityLevel', ctx), 4);
  assert.strictEqual(vm.runInContext('doubleYangLevel', ctx), 5);
  assert.strictEqual(vm.runInContext('crownBonusLevel', ctx), 3);
  assert.strictEqual(vm.runInContext('maxShields2Owned', ctx), true);
});

test('player upgrade JSON load fills missing values with defaults', () => {
  const { ctx } = createBaseContext({
    nw_flappy_player_upgrades: JSON.stringify({ currencyLuck: 3, rocketPower: 1 })
  });
  ctx.yang = 0;
  ctx.wallets = 0;
  ctx.dragonCoins = 0;
  ctx.t = (key) => key;
  ctx.isHeirloomRocketPurchased = () => true;

  vm.runInContext(upgradesSource, ctx);

  assert.strictEqual(ctx.getUpgradeLevel('currencyLuck'), 3);
  assert.strictEqual(ctx.getUpgradeLevel('rocketPower'), 1);
  assert.strictEqual(ctx.getUpgradeLevel('rocketExtraAmmo'), 0);
  assert.strictEqual(ctx.getUpgradeLevel('rocketReloadSpeed'), 0);
});

test('player upgrade JSON load survives broken JSON with safe defaults', () => {
  const { ctx } = createBaseContext({ nw_flappy_player_upgrades: '{broken' });
  ctx.yang = 0;
  ctx.wallets = 0;
  ctx.dragonCoins = 0;
  ctx.t = (key) => key;
  ctx.isHeirloomRocketPurchased = () => true;

  vm.runInContext(upgradesSource, ctx);

  assert.strictEqual(ctx.getUpgradeLevel('currencyLuck'), 0);
  assert.strictEqual(ctx.getUpgradeLevel('rocketExtraAmmo'), 0);
  assert.strictEqual(ctx.getUpgradeLevel('rocketReloadSpeed'), 0);
  assert.strictEqual(ctx.getUpgradeLevel('rocketPower'), 0);
});
