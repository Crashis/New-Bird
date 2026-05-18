const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const skinsCss = fs.readFileSync(path.join(repoRoot, 'src/css/skins.css'), 'utf8');
const skinsJs = fs.readFileSync(path.join(repoRoot, 'src/js/features/skins.js'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function cssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(skinsCss);
  return match ? match[1] : '';
}

function makeElement(tagName = 'div') {
  const children = [];
  const classSet = new Set();
  const el = {
    tagName: tagName.toUpperCase(),
    children,
    dataset: {},
    style: {},
    disabled: false,
    title: '',
    textContent: '',
    onclick: null,
    appendChild(child) {
      children.push(child);
      child.parentNode = el;
      return child;
    },
    set innerHTML(value) {
      children.length = 0;
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || '';
    },
    classList: {
      add(name) { classSet.add(name); },
      remove(name) { classSet.delete(name); },
      contains(name) { return classSet.has(name); },
      toggle(name, force) {
        const shouldAdd = typeof force === 'boolean' ? force : !classSet.has(name);
        if (shouldAdd) classSet.add(name);
        else classSet.delete(name);
        return shouldAdd;
      }
    },
    get className() {
      return Array.from(classSet).join(' ');
    },
    set className(value) {
      classSet.clear();
      String(value).split(/\s+/).filter(Boolean).forEach(name => classSet.add(name));
    }
  };

  if (tagName === 'canvas') {
    el.getContext = () => ({
      save() {}, restore() {}, beginPath() {}, arc() {}, ellipse() {},
      fill() {}, stroke() {}, fillRect() {}, createRadialGradient() {
        return { addColorStop() {} };
      },
      set fillStyle(value) {}, set strokeStyle(value) {}, set lineWidth(value) {}
    });
  }

  return el;
}

function loadPanelEnv() {
  const elements = {
    skinsPanel: makeElement('div'),
    skinsGrid: makeElement('div'),
    skinsDetail: makeElement('div')
  };
  elements.skinsPanel.className = 'shop-panel large-panel skins-panel-v2';

  const tabButtons = ['player', 'trails', 'specials'].map((cat) => {
    const button = makeElement('button');
    button.className = cat === 'player' ? 'skin-tab skins-tab active' : 'skin-tab skins-tab';
    button.dataset.skinTab = cat;
    return button;
  });

  const context = {
    console,
    window: {},
    performance: { now: () => 0 },
    localStorage: { setItem() {}, getItem() { return null; } },
    document: {
      getElementById(id) { return elements[id] || null; },
      createElement: makeElement,
      querySelectorAll(selector) {
        return ['.skins-tab', '.skin-tab', '.skin-tab, .skins-tab'].includes(selector) ? tabButtons : [];
      }
    },
    SKINS: [
      { id: 'base', category: 'player', name: 'Player', desc: 'Default', unlocked: true },
      { id: 'locked-player', category: 'player', name: 'Locked Player', desc: 'Locked', unlocked: false, priceWallets: 5 }
    ],
    TRAILS: [
      { id: 'arcane-glow', category: 'trails', type: 'glow', name: 'Arcane Glow', desc: 'Glow', unlocked: true, customizableColor: true },
      { id: 'ember-trail', category: 'trails', type: 'fire', name: 'Ember Trail', desc: 'Fire', unlocked: false, cost: { yang: 50 } }
    ],
    SPECIALS: [
      { id: 'ghost-rider', category: 'specials', name: 'Ghost Rider', desc: 'Flames', unlocked: true },
      { id: 'wraith-eyes', category: 'specials', name: 'Wraith Eyes', desc: 'Eyes', unlocked: false, cost: { errCubes: 1 } }
    ],
    selectedSkinId: 'base',
    selectedTrailId: 'arcane-glow',
    selectedTrailColor: '#34d36a',
    selectedSpecialIds: ['ghost-rider'],
    TRAIL_COLOR_PALETTE: [{ id: 'green', hex: '#34d36a' }],
    skinImages: new Map([['base', { src: 'base.png' }], ['locked-player', { src: 'locked.png' }]]),
    headImg: { src: 'head.png' },
    gameState: 'menu',
    activeVoiceLine: '',
    activeVoiceLineUntil: 0,
    wallets: 0,
    yang: 0,
    dragonCoins: 0,
    errCubes: 0,
    t(key, vars) { return vars && vars.price ? `${key} ${vars.price}` : key; },
    closeOtherPanels() {},
    saveUnlockedSkins() {},
    saveEconomy() {},
    updateEconomyUi() {},
    handleSkinUnlocked() {},
    showUnlockToast() {},
    checkSkinAchievements() {},
    canAffordTrail() { return false; },
    buyTrail() { return false; },
    equipTrail() { return true; },
    unequipTrail() { return true; },
    setTrailColor() { return true; },
    canAffordSpecial() { return false; },
    buySpecial() { return false; },
    equipSpecial() { return true; },
    unequipSpecial() { return true; },
    isSpecialEquipped(id) { return context.selectedSpecialIds.includes(id); },
    trailHexToRgba(hex, a) { return `rgba(0,0,0,${a})`; }
  };

  context.window = context;
  vm.createContext(context);
  vm.runInContext(skinsJs, context);
  return { context, elements, tabButtons };
}

test('inactive skins panel keeps base hidden display and active state enables flex layout', () => {
  const baseBlock = cssBlock('.shop-panel.skins-panel-v2');
  const activeBlock = cssBlock('.shop-panel.skins-panel-v2.active');

  assert.match(baseBlock, /display\s*:\s*none\s*;/, 'base skins panel must stay hidden until active');
  assert.match(activeBlock, /display\s*:\s*flex\s*;/, 'active skins panel should use stable flex layout');
});

test('renderSkinsPanel renders player, trail, and special grids through tab changes', () => {
  const { context, elements, tabButtons } = loadPanelEnv();

  vm.runInContext('toggleSkinsPanel(true)', context);
  assert.strictEqual(elements.skinsPanel.classList.contains('active'), true);
  assert.strictEqual(elements.skinsGrid.children.length, 2);
  assert.strictEqual(elements.skinsDetail.children.length > 0, true);
  assert.strictEqual(tabButtons[0].classList.contains('active'), true);

  vm.runInContext("setSkinCategory('trails')", context);
  assert.strictEqual(elements.skinsGrid.children.length, 2);
  assert.strictEqual(tabButtons[1].classList.contains('active'), true);

  vm.runInContext("setSkinCategory('specials')", context);
  assert.strictEqual(elements.skinsGrid.children.length, 2);
  assert.strictEqual(tabButtons[2].classList.contains('active'), true);
});
