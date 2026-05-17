const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const skinsDataSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/skinsData.js'), 'utf8');

function loadSkinsEnv(options = {}) {
  const store = new Map(Object.entries(options.localStorage || {}));
  const imageLoads = [];

  function TestImage() {
    this.complete = false;
    this.naturalWidth = 0;
    this.onerror = null;
  }

  Object.defineProperty(TestImage.prototype, 'src', {
    get() {
      return this._src || '';
    },
    set(value) {
      this._src = value;
      imageLoads.push(value);
      if (!value.startsWith('data:')) {
        const assetPath = path.join(repoRoot, value.replace(/\//g, path.sep));
        if (fs.existsSync(assetPath)) {
          this.complete = true;
          this.naturalWidth = 100;
        } else {
          this.complete = true;
          this.naturalWidth = 0;
          if (typeof this.onerror === 'function') this.onerror();
        }
      } else {
        this.complete = true;
        this.naturalWidth = 100;
      }
    }
  });

  const context = {
    Image: TestImage,
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
        if (id === 'gameCanvas') {
          return { getContext: () => ({}) };
        }
        return null;
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(skinsDataSource, context);
  return { context, imageLoads };
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

test('Půlprdeláč keeps its storage id, price, and existing metadata', () => {
  const env = loadSkinsEnv();
  const skin = readGlobal(env.context, "SKINS.find(s => s.name === 'Půlprdeláč')");

  assert.ok(skin, 'Půlprdeláč skin exists');
  assert.strictEqual(skin.id, 'pulprdelac');
  assert.strictEqual(skin.priceWallets, 10);
  assert.strictEqual(
    skin.desc,
    'Legenda sjezdovek. Kdo mu zkříží stopu, odjíždí s natrženýma půlkama.'
  );
});

test('Půlprdeláč image path points at a real asset loaded into the skin image map', () => {
  const env = loadSkinsEnv();
  const skin = readGlobal(env.context, "SKINS.find(s => s.id === 'pulprdelac')");
  const imageIsLoaded = readGlobal(
    env.context,
    "skinImages.get('pulprdelac') && skinImages.get('pulprdelac').naturalWidth > 0"
  );

  assert.strictEqual(skin.src, 'assets/skins/pulprdelac.png');
  assert.ok(fs.existsSync(path.join(repoRoot, skin.src)), `${skin.src} exists`);
  assert.strictEqual(imageIsLoaded, true);
});

test('Admin skin remains last in the skin list', () => {
  const env = loadSkinsEnv();
  const lastSkinId = readGlobal(env.context, 'SKINS[SKINS.length - 1].id');

  assert.strictEqual(lastSkinId, 'admin');
});
