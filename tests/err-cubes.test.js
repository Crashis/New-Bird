const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const constantsSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/constants.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(repoRoot, 'src/js/core/state.js'), 'utf8');
const currenciesSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/currencies.js'), 'utf8');
const obstaclesSource = fs.readFileSync(path.join(repoRoot, 'src/js/game/obstacles.js'), 'utf8');

function createElement() {
  return {
    textContent: '',
    disabled: false,
    classList: {
      toggle() {}
    }
  };
}

function loadErrCubeEnv(options = {}) {
  const store = new Map(Object.entries(options.localStorage || {}));
  const elements = {
    gameYang: createElement(),
    gameWallets: createElement(),
    gameDragonCoins: createElement(),
    gameErrCubes: createElement(),
    shopYang: createElement(),
    shopWallets: createElement(),
    shopErrCubes: createElement(),
    heirloomErrCubes: createElement()
  };
  const spoken = [];
  const randomValues = Array.isArray(options.randomValues) ? options.randomValues.slice() : [];

  const context = {
    console,
    window: {
      PERF_MOBILE: false,
      PERF_MOBILE_AUTO: false,
      NWUtils: { refreshPerfMobile() {} },
      speechSynthesis: {
        cancel() {
          spoken.push({ type: 'cancel' });
        },
        speak(utterance) {
          spoken.push({ type: 'speak', text: utterance.text, lang: utterance.lang });
        }
      },
      NWI18n: {
        getCurrentLanguage() { return 'en'; }
      }
    },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
    },
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      }
    },
    document: {
      body: { classList: { toggle() {} } },
      addEventListener() {},
      getElementById(id) {
        return elements[id] || null;
      }
    },
    Math: Object.create(Math),
    performance: {
      now() { return 1000; }
    },
    canvas: { width: 1000, height: 700 },
    pipes: [],
    particles: [],
    ACHIEVEMENTS: [],
    SKINS: [],
    TRAILS: [],
    SPECIALS: [],
    TRAIL_DEFAULT_COLOR: '#ffffff',
    IMMORTALITY_USES_KEY: 'nw_flappy_immortality_uses',
    t(key) {
      const dict = {
        'voice.errCube': 'Rock and Stones, brothers!'
      };
      return dict[key] || key;
    },
    renderShellGamePanel() {},
    renderHeirloomPanel() {},
    renderUpgradesPanel() {},
    saveAchievementCounters() {},
    unlockAchievement() {},
    checkAchievements() {},
    getInvincibleDurationMs() { return 2000; },
    getDoubleYangDuration() { return 8000; },
    getCrownBonusValue() { return 1; },
    addScore() {},
    addYangs() {},
    getGodiasWalletMultiplier() { return 1; },
    showUnlockToast() {},
    pickPowerupType() { return 'invincibility'; },
    getCurrencySpawnBonus() { return { yang: 0, wallet: 0, dragonCoin: 0 }; }
  };

  context.Math.random = () => {
    if (!randomValues.length) return 0.99;
    return randomValues.shift();
  };

  vm.createContext(context);
  vm.runInContext(constantsSource, context);
  vm.runInContext(stateSource, context);
  vm.runInContext(currenciesSource, context);
  vm.runInContext(obstaclesSource, context);

  return { context, store, elements, spoken };
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

test('old saves without errCubes start at zero and render zero', () => {
  const env = loadErrCubeEnv();

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 0);
  env.context.updateEconomyUi();

  assert.strictEqual(env.elements.gameErrCubes.textContent, '0');
  assert.strictEqual(env.elements.shopErrCubes.textContent, '0');
  assert.strictEqual(env.elements.heirloomErrCubes.textContent, '0');
});

test('adding an Err cube increments, persists, and updates currency UI', () => {
  const env = loadErrCubeEnv();

  env.context.addErrCubes(1);

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 1);
  assert.strictEqual(env.store.get('nw_flappy_err_cubes'), '1');
  assert.strictEqual(env.elements.gameErrCubes.textContent, '1');
  assert.strictEqual(env.elements.shopErrCubes.textContent, '1');
  assert.strictEqual(env.elements.heirloomErrCubes.textContent, '1');
});

test('spawnPipe can add a rare Err cube to an otherwise empty pipe below 2 percent', () => {
  const env = loadErrCubeEnv({ randomValues: [0.5, 0.019] });

  env.context.spawnPipe();

  const pipes = readGlobal(env.context, 'pipes');
  assert.strictEqual(pipes.length, 1);
  assert.strictEqual(pipes[0].coin.type, 'errCube');
  assert.strictEqual(pipes[0].yang, null);
});

test('spawnPipe does not add an Err cube at the old 3 percent rate', () => {
  const env = loadErrCubeEnv({ randomValues: [0.5, 0.029] });

  env.context.spawnPipe();

  const pipes = readGlobal(env.context, 'pipes');
  assert.strictEqual(pipes.length, 1);
  assert.strictEqual(pipes[0].coin, null);
  assert.strictEqual(pipes[0].yang, null);
});

test('collecting an Err cube awards one and speaks the exact voice line when enabled', () => {
  const env = loadErrCubeEnv();

  env.context.applyPowerup({ type: 'errCube', x: 120, y: 240, r: 18, collected: true });

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 1);
  assert.strictEqual(env.store.get('nw_flappy_err_cubes'), '1');
  assert.strictEqual(readGlobal(env.context, 'activeVoiceLine'), 'Rock and Stones, brothers!');
  assert.strictEqual(env.spoken.some(call => call.type === 'speak' && call.text === 'Rock and Stones, brothers!'), true);
});

test('Err cube voice line respects disabled voice lines', () => {
  const env = loadErrCubeEnv();
  vm.runInContext('settings.voiceLines = false', env.context);

  env.context.applyPowerup({ type: 'errCube', x: 120, y: 240, r: 18, collected: true });

  assert.strictEqual(readGlobal(env.context, 'errCubes'), 1);
  assert.strictEqual(readGlobal(env.context, 'activeVoiceLine'), null);
  assert.strictEqual(env.spoken.some(call => call.type === 'speak'), false);
});
