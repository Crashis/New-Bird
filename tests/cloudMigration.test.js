const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(repoRoot, 'src/js/features/cloudMigration.js'), 'utf8');

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
    console: { warn() {}, log() {} }
  };
  ctx.window.localStorage = storage;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}

function test(name, fn) {
  try { fn(); console.log(`ok - ${name}`); }
  catch (e) { console.error(`not ok - ${name}`); throw e; }
}

test('A: firebase unavailable -> noop', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: false, hasLocal: true, hasCloud: true });
  assert.strictEqual(out.action, 'noop');
});

test('B: cloud missing, local meaningful -> prompt-upload', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: false });
  assert.strictEqual(out.action, 'prompt-upload');
});

test('B-empty: cloud missing, local empty -> noop', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: false, hasCloud: false });
  assert.strictEqual(out.action, 'noop');
});

test('C: cloud exists, local empty -> prompt-download', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: false, hasCloud: true });
  assert.strictEqual(out.action, 'prompt-download');
});

test('D: cloud and local both exist -> prompt-conflict', () => {
  const ctx = loadEnv();
  const out = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: true });
  assert.strictEqual(out.action, 'prompt-conflict');
});

test('Dismissed flag suppresses prompt-upload only', () => {
  const ctx = loadEnv();
  const dismissed = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: false, migrationDismissed: true });
  assert.strictEqual(dismissed.action, 'noop');
  // Download still offered
  const dl = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: false, hasCloud: true, migrationDismissed: true });
  assert.strictEqual(dl.action, 'prompt-download');
  // Conflict still offered
  const cf = ctx.window.NWCloudMigration.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: true, migrationDismissed: true });
  assert.strictEqual(cf.action, 'prompt-conflict');
});

test('markMigrationDismissed and wasMigrationDismissed round-trip', () => {
  const ctx = loadEnv();
  const M = ctx.window.NWCloudMigration;
  assert.strictEqual(M.wasMigrationDismissed(), false);
  M.markMigrationDismissed();
  assert.strictEqual(M.wasMigrationDismissed(), true);
});

test('clearMigrationDismissed wipes the flag', () => {
  const ctx = loadEnv({ cloudSaveMigrationDismissed: '1' });
  const M = ctx.window.NWCloudMigration;
  assert.strictEqual(M.wasMigrationDismissed(), true);
  M.clearMigrationDismissed();
  assert.strictEqual(M.wasMigrationDismissed(), false);
});

test('decideMigrationAction returns reason field', () => {
  const ctx = loadEnv();
  const M = ctx.window.NWCloudMigration;
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: false }).reason, 'firebase-unavailable');
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: false }).reason, 'local-only');
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: true, hasLocal: false, hasCloud: true }).reason, 'cloud-only');
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: true }).reason, 'both');
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: true }).reason, 'empty');
  assert.strictEqual(M.decideMigrationAction({ firebaseAvailable: true, hasLocal: true, hasCloud: false, migrationDismissed: true }).reason, 'dismissed');
});
