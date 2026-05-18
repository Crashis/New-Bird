const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const storageSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/storage.js'), 'utf8');
const snapshotSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/progressSnapshot.js'), 'utf8');

function createMockStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; },
    get _data() { return data; }
  };
}

function loadEnv(initialStorage = {}) {
  const storage = createMockStorage(initialStorage);
  const ctx = {
    window: {},
    localStorage: storage,
    console: { warn() {}, log() {}, error() {} },
    // Share host JSON so JSON.parse returns host-prototype arrays/objects (required for deepStrictEqual across vm boundary)
    JSON
  };
  ctx.window.localStorage = storage;
  vm.createContext(ctx);
  vm.runInContext(storageSource, ctx);
  vm.runInContext(snapshotSource, ctx);
  // Wrap NWProgressSnapshot methods to normalize results through JSON so that
  // assert.deepStrictEqual works: vm-context object literals ({}, []) have a
  // different prototype than host-context values, but JSON round-trip gives host types.
  const raw = ctx.window.NWProgressSnapshot;
  ctx.window.NWProgressSnapshot = {
    readLocalProgressSnapshot() {
      return JSON.parse(JSON.stringify(raw.readLocalProgressSnapshot()));
    },
    normalizeProgressSnapshot(input) {
      return JSON.parse(JSON.stringify(raw.normalizeProgressSnapshot(input)));
    },
    applyProgressSnapshotToLocalStorage: raw.applyProgressSnapshotToLocalStorage.bind(raw),
    isLocalProgressMeaningful: raw.isLocalProgressMeaningful.bind(raw),
    summarizeProgressSnapshot(snap) {
      return JSON.parse(JSON.stringify(raw.summarizeProgressSnapshot(snap)));
    },
    compareProgressSnapshots: raw.compareProgressSnapshots.bind(raw)
  };
  return ctx;
}

function test(name, fn) {
  try { fn(); console.log(`ok - ${name}`); }
  catch (e) { console.error(`not ok - ${name}`); throw e; }
}

test('readLocalProgressSnapshot returns empty snapshot when storage is empty', () => {
  const ctx = loadEnv();
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(typeof snap, 'object');
  assert.strictEqual(snap.bestScore, 0);
  assert.strictEqual(snap.yang, 0);
  assert.strictEqual(snap.wallets, 0);
  assert.deepStrictEqual(snap.ownedSkins, []);
  assert.deepStrictEqual(snap.achievements, {});
});

test('readLocalProgressSnapshot survives corrupted JSON', () => {
  const ctx = loadEnv({
    nw_flappy_unlocked_skins: '{not json',
    nw_flappy_achievements: 'broken',
    nw_flappy_player_upgrades: 'xxx'
  });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.deepStrictEqual(snap.ownedSkins, []);
  assert.deepStrictEqual(snap.achievements, {});
  assert.deepStrictEqual(snap.upgrades.player, {});
});

test('readLocalProgressSnapshot picks up currencies and upgrades', () => {
  const ctx = loadEnv({
    nw_flappy_best: '42',
    nw_flappy_yang: '100',
    nw_flappy_wallets: '5',
    nw_flappy_dragon_coins: '3',
    nw_flappy_err_cubes: '1',
    nw_flappy_upgrade_shield_start: '1',
    nw_flappy_upgrade_invincibility: '2',
    nw_flappy_selected_skin: 'godias-zubaty',
    nw_flappy_unlocked_skins: '["skin-a","skin-b"]',
    heirloomRocketPurchased: '1',
    bezosBossTicketUnlocked: '1',
    nw_player_name: 'Petr'
  });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(snap.bestScore, 42);
  assert.strictEqual(snap.yang, 100);
  assert.strictEqual(snap.wallets, 5);
  assert.strictEqual(snap.dragonCoins, 3);
  assert.strictEqual(snap.errCubes, 1);
  assert.strictEqual(snap.upgrades.shieldStart, true);
  assert.strictEqual(snap.upgrades.invincibility, 2);
  assert.strictEqual(snap.selectedSkin, 'godias-zubaty');
  assert.deepStrictEqual(snap.ownedSkins, ['skin-a', 'skin-b']);
  assert.strictEqual(snap.heirlooms.rocketPurchased, true);
  assert.strictEqual(snap.boss.bezosTicketUnlocked, true);
  assert.strictEqual(snap.nickname, 'Petr');
});

test('normalizeProgressSnapshot clamps numbers and fills defaults', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWProgressSnapshot.normalizeProgressSnapshot({
    bestScore: -5, yang: 'NaN', dragonCoins: 200000
  });
  assert.strictEqual(out.bestScore, 0);
  assert.strictEqual(out.yang, 0);
  assert.strictEqual(out.dragonCoins, 200000);
  assert.strictEqual(typeof out.heirlooms, 'object');
  assert.deepStrictEqual(out.ownedSkins, []);
});

test('normalizeProgressSnapshot caps bestScore at 100000', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWProgressSnapshot.normalizeProgressSnapshot({ bestScore: 999999 });
  assert.strictEqual(out.bestScore, 100000);
});

test('isLocalProgressMeaningful returns false on empty snapshot', () => {
  const ctx = loadEnv();
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(ctx.window.NWProgressSnapshot.isLocalProgressMeaningful(snap), false);
});

test('isLocalProgressMeaningful is true when player has bestScore or currency', () => {
  const ctx = loadEnv({ nw_flappy_best: '42' });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(ctx.window.NWProgressSnapshot.isLocalProgressMeaningful(snap), true);
});

test('isLocalProgressMeaningful is true when player has unlocked skins', () => {
  const ctx = loadEnv({ nw_flappy_unlocked_skins: '["skin-a"]' });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(ctx.window.NWProgressSnapshot.isLocalProgressMeaningful(snap), true);
});

test('isLocalProgressMeaningful is true when heirloom purchased', () => {
  const ctx = loadEnv({ heirloomRocketPurchased: '1' });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(ctx.window.NWProgressSnapshot.isLocalProgressMeaningful(snap), true);
});

test('applyProgressSnapshotToLocalStorage writes all keys and round-trips', () => {
  const ctx = loadEnv();
  const input = {
    bestScore: 123, yang: 50, wallets: 5, dragonCoins: 3, errCubes: 1,
    upgrades: { shieldStart: true, invincibility: 2, doubleYang: 1, crownBonus: 0, maxShields2: true, immortalityUses: 3, player: { currencyLuck: 4 } },
    selectedSkin: 'godias-zubaty', ownedSkins: ['skin-a', 'skin-b'],
    achievements: { first_run: { unlocked: true, rewardClaimed: true, unlockedAt: 1 } },
    heirlooms: { rocketPurchased: true, rocketEquipped: false, potionPurchased: false, potionEquipped: false, godiasPurchased: false, godiasEquipped: false, concertPurchased: false, paysafePurchased: false, neschopenkaPurchased: true },
    boss: { bezosTicketUnlocked: true, bezosLastWinDate: '2026-05-18', bezosBonusUsedDate: '' },
    dungeons: { dragonEggDate: '2026-05-18', dragonEggUses: 2, dragonEggState: { active: false }, blacksmithDate: '', blacksmithPlays: 0, threeChestsDate: '', wheelDate: '' },
    nickname: 'Petr'
  };
  ctx.window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage(input);
  const out = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(out.bestScore, 123);
  assert.strictEqual(out.yang, 50);
  assert.deepStrictEqual(out.ownedSkins, ['skin-a', 'skin-b']);
  assert.strictEqual(out.upgrades.shieldStart, true);
  assert.strictEqual(out.heirlooms.rocketPurchased, true);
  assert.strictEqual(out.heirlooms.neschopenkaPurchased, true);
  assert.strictEqual(out.boss.bezosTicketUnlocked, true);
  assert.strictEqual(out.nickname, 'Petr');
});

test('applyProgressSnapshotToLocalStorage handles garbage input safely', () => {
  const ctx = loadEnv();
  ctx.window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage(null);
  ctx.window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage('garbage');
  ctx.window.NWProgressSnapshot.applyProgressSnapshotToLocalStorage({ bestScore: 'NaN', ownedSkins: 'not-array' });
  const snap = ctx.window.NWProgressSnapshot.readLocalProgressSnapshot();
  assert.strictEqual(snap.bestScore, 0);
  assert.deepStrictEqual(snap.ownedSkins, []);
});

test('summarizeProgressSnapshot returns counts and totals', () => {
  const ctx = loadEnv();
  const s = ctx.window.NWProgressSnapshot.summarizeProgressSnapshot({
    bestScore: 50, yang: 100, wallets: 5, dragonCoins: 2, ownedSkins: ['a','b'], achievements: { x: {} }
  });
  assert.strictEqual(s.bestScore, 50);
  assert.strictEqual(s.yang, 100);
  assert.strictEqual(s.wallets, 5);
  assert.strictEqual(s.skinCount, 2);
  assert.strictEqual(s.achievementCount, 1);
});

test('compareProgressSnapshots picks higher bestScore', () => {
  const ctx = loadEnv();
  const cmp = ctx.window.NWProgressSnapshot.compareProgressSnapshots;
  assert.strictEqual(cmp({ bestScore: 100 }, { bestScore: 50 }), 'a');
  assert.strictEqual(cmp({ bestScore: 50 }, { bestScore: 100 }), 'b');
  assert.strictEqual(cmp({ bestScore: 50 }, { bestScore: 50 }), 'equal');
});

test('compareProgressSnapshots falls back to skinCount/achievement/yang ordering', () => {
  const ctx = loadEnv();
  const cmp = ctx.window.NWProgressSnapshot.compareProgressSnapshots;
  // Same bestScore, more skins
  assert.strictEqual(cmp({ bestScore: 50, ownedSkins: ['a','b'] }, { bestScore: 50, ownedSkins: ['a'] }), 'a');
  // Same bestScore/skinCount, more achievements
  assert.strictEqual(cmp({ bestScore: 50, achievements: { x: {}, y: {} } }, { bestScore: 50, achievements: { x: {} } }), 'a');
  // Same everything except yang
  assert.strictEqual(cmp({ bestScore: 50, yang: 100 }, { bestScore: 50, yang: 50 }), 'a');
});
