const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const storageSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/storage.js'), 'utf8');
const snapshotSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/progressSnapshot.js'), 'utf8');
const resetSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/progressReset.js'), 'utf8');

function createMockStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    get _data() { return data; }
  };
}

function loadEnv(initialStorage = {}, opts = {}) {
  const storage = createMockStorage(initialStorage);
  const ctx = {
    window: {},
    localStorage: storage,
    console: { warn() {}, log() {}, error() {} },
    JSON
  };
  ctx.window.localStorage = storage;
  if (opts.cloudSave) ctx.window.NWCloudSave = opts.cloudSave;
  vm.createContext(ctx);
  vm.runInContext(storageSource, ctx);
  vm.runInContext(snapshotSource, ctx);
  vm.runInContext(resetSource, ctx);
  return { ctx, storage };
}

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(() => console.log(`ok - ${name}`), e => { console.error(`not ok - ${name}`); throw e; });
    }
    console.log(`ok - ${name}`);
  } catch (e) { console.error(`not ok - ${name}`); throw e; }
}

const SETTINGS_KEYS = ['nw_flappy_settings_sfx', 'nw_flappy_settings_music', 'nw_flappy_settings_voice_lines', 'nw_flappy_settings_effects', 'nw_lang'];

(async () => {

  test('reset removes all progress keys', () => {
    const { ctx, storage } = loadEnv({
      nw_flappy_best: '99',
      nw_flappy_yang: '500',
      nw_flappy_dragon_coins: '20',
      nw_flappy_unlocked_skins: '["a","b"]',
      heirloomRocketPurchased: '1',
      bezosBossTicketUnlocked: '1',
      cloudSaveMigrationDismissed: '1',
      nw_player_name: 'Petr'
    });
    ctx.window.NWProgressReset.resetLocalProgressToDefaults();
    const list = ctx.window.NWStorage.PROGRESS_KEY_LIST;
    for (const key of list) {
      assert.strictEqual(storage.getItem(key), null, `${key} should be cleared`);
    }
    assert.strictEqual(storage.getItem('cloudSaveMigrationDismissed'), null, 'migration dismissed flag should be cleared');
  });

  test('reset does not touch settings/language keys', () => {
    const initial = {};
    for (const k of SETTINGS_KEYS) initial[k] = '1';
    initial.nw_flappy_best = '50';
    const { ctx, storage } = loadEnv(initial);
    ctx.window.NWProgressReset.resetLocalProgressToDefaults();
    for (const k of SETTINGS_KEYS) {
      assert.strictEqual(storage.getItem(k), '1', `${k} should survive reset`);
    }
    assert.strictEqual(storage.getItem('nw_flappy_best'), null);
  });

  test('default snapshot has expected zeroed values', () => {
    const { ctx } = loadEnv();
    const def = JSON.parse(JSON.stringify(ctx.window.NWProgressSnapshot.createDefaultProgressSnapshot()));
    assert.strictEqual(def.bestScore, 0);
    assert.strictEqual(def.yang, 0);
    assert.strictEqual(def.wallets, 0);
    assert.strictEqual(def.dragonCoins, 0);
    assert.strictEqual(def.errCubes, 0);
    assert.deepStrictEqual(def.ownedSkins, []);
    assert.deepStrictEqual(def.achievements, {});
    assert.strictEqual(def.heirlooms.rocketPurchased, false);
    assert.strictEqual(def.boss.bezosTicketUnlocked, false);
    assert.strictEqual(def.upgrades.shieldStart, false);
    assert.strictEqual(def.upgrades.invincibility, 0);
  });

  test('reset survives broken JSON values', () => {
    const { ctx, storage } = loadEnv({
      nw_flappy_unlocked_skins: '{not-json',
      nw_flappy_achievements: 'broken',
      nw_flappy_best: 'NaN'
    });
    // Should not throw
    ctx.window.NWProgressReset.resetLocalProgressToDefaults();
    assert.strictEqual(storage.getItem('nw_flappy_unlocked_skins'), null);
    assert.strictEqual(storage.getItem('nw_flappy_achievements'), null);
    assert.strictEqual(storage.getItem('nw_flappy_best'), null);
  });

  await test('resetAllProgress: cloud failure aborts local reset', async () => {
    const cloudSave = {
      getCloudSaveStatus() { return { status: 'synced' }; },
      async resetCloudProgressToDefaults() { return false; }
    };
    const { ctx, storage } = loadEnv({ nw_flappy_best: '77', nw_flappy_yang: '10' }, { cloudSave });
    const result = await ctx.window.NWProgressReset.resetAllProgress();
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.stage, 'cloud');
    assert.strictEqual(storage.getItem('nw_flappy_best'), '77', 'local progress must remain intact when cloud reset fails');
  });

  await test('resetAllProgress: cloud success then local cleared', async () => {
    let cloudReset = false;
    const cloudSave = {
      getCloudSaveStatus() { return { status: 'synced' }; },
      async resetCloudProgressToDefaults() { cloudReset = true; return true; }
    };
    const { ctx, storage } = loadEnv({ nw_flappy_best: '77', nw_flappy_yang: '10' }, { cloudSave });
    const result = await ctx.window.NWProgressReset.resetAllProgress();
    assert.strictEqual(result.ok, true);
    assert.strictEqual(cloudReset, true);
    assert.strictEqual(storage.getItem('nw_flappy_best'), null);
    assert.strictEqual(storage.getItem('nw_flappy_yang'), null);
  });

  await test('resetAllProgress: cloud disabled -> local reset only', async () => {
    const cloudSave = {
      getCloudSaveStatus() { return { status: 'disabled' }; },
      async resetCloudProgressToDefaults() { throw new Error('should not be called'); }
    };
    const { ctx, storage } = loadEnv({ nw_flappy_best: '5' }, { cloudSave });
    const result = await ctx.window.NWProgressReset.resetAllProgress();
    assert.strictEqual(result.ok, true);
    assert.strictEqual(storage.getItem('nw_flappy_best'), null);
  });

})().catch(e => { console.error(e); process.exit(1); });
