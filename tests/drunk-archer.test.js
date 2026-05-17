const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const archerSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/drunkArcher.js'), 'utf8');
const panelsSource = fs.readFileSync(path.join(repoRoot, 'src/js/ui/panels.js'), 'utf8');
const mainSource = fs.readFileSync(path.join(repoRoot, 'src/js/main.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function createElement() {
  return {
    textContent: '',
    disabled: false,
    style: {},
    className: '',
    classList: {
      values: new Set(),
      add(name) { this.values.add(name); },
      remove(name) { this.values.delete(name); },
      toggle(name, force) {
        if (force) this.values.add(name);
        else this.values.delete(name);
      }
    }
  };
}

function loadArcherEnv(options = {}) {
  const store = new Map();
  const elements = {
    drunkArcherErrCubes: createElement(),
    drunkArcherYangs: createElement(),
    drunkArcherWallets: createElement(),
    drunkArcherDragonCoins: createElement(),
    drunkArcherTarget: createElement(),
    drunkArcherPerfectZone: createElement(),
    drunkArcherGoodZone: createElement(),
    drunkArcherMarker: createElement(),
    drunkArcherStartBtn: createElement(),
    drunkArcherShootBtn: createElement(),
    drunkArcherStatus: createElement()
  };
  const randomValues = Array.isArray(options.randomValues) ? options.randomValues.slice() : [];
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
    Math: Object.create(Math),
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    performance: {
      now() { return Number(options.now || 1000); }
    },
    yang: Number(options.yang || 0),
    wallets: Number(options.wallets || 0),
    dragonCoins: Number(options.dragonCoins || 0),
    errCubes: Number(options.errCubes || 0),
    updateEconomyUiCalls: 0,
    updateEconomyUi() {
      context.updateEconomyUiCalls++;
    },
    saveEconomy() {
      store.set('nw_flappy_yang', String(context.yang));
      store.set('nw_flappy_wallets', String(context.wallets));
      store.set('nw_flappy_err_cubes', String(context.errCubes));
    },
    saveDragonCoins() {
      store.set('nw_flappy_dragon_coins', String(context.dragonCoins));
    }
  };
  context.Math.random = () => randomValues.length ? randomValues.shift() : 0.5;
  vm.createContext(context);
  vm.runInContext(archerSource, context);
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

test('Taverna can open Opily lukostrelec and main loader includes its script', () => {
  assert.match(indexSource, /Opil/);
  assert.match(indexSource, /drunkArcherPanel/);
  assert.match(panelsSource, /drunkArcherPanel/);
  assert.match(panelsSource, /initDrunkArcher/);
  assert.match(mainSource, /drunkArcher\.js/);
});

test('cannot start without an Err cube', () => {
  const env = loadArcherEnv({ errCubes: 0 });

  env.context.startDrunkArcherAttempt();

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 0);
  assert.strictEqual(env.elements.drunkArcherStatus.textContent, 'Nemáš žádnou Err kostku.');
});

test('starting an attempt spends one Err cube and prevents a second start while aiming', () => {
  const env = loadArcherEnv({ errCubes: 2, randomValues: [0.5] });

  env.context.startDrunkArcherAttempt();
  env.context.startDrunkArcherAttempt();

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 1);
  assert.strictEqual(env.store.get('nw_flappy_err_cubes'), '1');
  assert.strictEqual(readGlobal(env.context, 'drunkArcherState'), 'aiming');
});

test('perfect shot pays yang and optional wallet and dragon coin once', () => {
  const env = loadArcherEnv({
    errCubes: 1,
    randomValues: [0.5, 0, 0.1, 0.05]
  });

  env.context.startDrunkArcherAttempt();
  vm.runInContext('drunkArcherMarkerPos = drunkArcherTargetCenter', env.context);
  env.context.shootDrunkArcher();
  env.context.shootDrunkArcher();

  assert.strictEqual(readGlobal(env.context, 'yang'), 40);
  assert.strictEqual(readGlobal(env.context, 'wallets'), 1);
  assert.strictEqual(readGlobal(env.context, 'dragonCoins'), 1);
  assert.strictEqual(readGlobal(env.context, 'drunkArcherState'), 'result');
});

test('miss consumes the Err cube and pays no reward', () => {
  const env = loadArcherEnv({ errCubes: 1, randomValues: [0.5] });

  env.context.startDrunkArcherAttempt();
  vm.runInContext('drunkArcherMarkerPos = 0', env.context);
  env.context.shootDrunkArcher();

  assert.strictEqual(readGlobal(env.context, 'yang'), 0);
  assert.strictEqual(readGlobal(env.context, 'wallets'), 0);
  assert.strictEqual(readGlobal(env.context, 'dragonCoins'), 0);
  assert.match(env.elements.drunkArcherStatus.textContent, /Err kostka je fuč/);
});
