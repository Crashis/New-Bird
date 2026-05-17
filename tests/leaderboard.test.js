const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const leaderboardSource = fs.readFileSync(path.join(repoRoot, 'src/js/features/leaderboard.js'), 'utf8');
const panelsSource = fs.readFileSync(path.join(repoRoot, 'src/js/ui/panels.js'), 'utf8');
const gameLoopSource = fs.readFileSync(path.join(repoRoot, 'src/js/game/gameLoop.js'), 'utf8');
const mainSource = fs.readFileSync(path.join(repoRoot, 'src/js/main.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function createClassList() {
  const values = new Set();
  return {
    values,
    add(name) { values.add(name); },
    remove(name) { values.delete(name); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      const shouldAdd = typeof force === 'boolean' ? force : !values.has(name);
      if (shouldAdd) values.add(name);
      else values.delete(name);
    }
  };
}

function createElement(id) {
  const element = {
    id,
    textContent: '',
    innerHTML: '',
    disabled: false,
    className: '',
    children: [],
    classList: createClassList(),
    dataset: {},
    style: {},
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    querySelector() {
      return null;
    }
  };
  return element;
}

function loadLeaderboardEnv(options = {}) {
  const elements = {
    leaderboardPanel: createElement('leaderboardPanel'),
    leaderboardBody: createElement('leaderboardBody'),
    leaderboardStatus: createElement('leaderboardStatus')
  };
  const created = [];
  const warnings = [];
  const context = {
    console: {
      warn(...args) { warnings.push(args); },
      log() {},
      error() {}
    },
    window: {},
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
      createElement(tagName) {
        const el = createElement('');
        el.tagName = tagName.toUpperCase();
        created.push(el);
        return el;
      }
    },
    gameState: options.gameState || 'idle',
    currentGameMode: options.currentGameMode || 'normal',
    selectedSkinId: options.selectedSkinId || 'godias-zubaty',
    SKINS: options.skins || [{ id: 'godias-zubaty', name: 'Godias Zubatý' }],
    closeOtherPanels(id) {
      context.closedPanel = id;
    },
    performance: { now() { return 1000; } },
    t(key) {
      const dict = {
        'leaderboard.sleeping': 'Leaderboard teď spí. Zkus to později.',
        'leaderboard.loading': 'Načítám leaderboard...',
        'panel.settingsBlocked': 'Blocked'
      };
      return dict[key] || key;
    }
  };
  vm.createContext(context);
  vm.runInContext(leaderboardSource, context);
  return { context, elements, created, warnings };
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

test('leaderboard files are wired into menu, panels, and loader', () => {
  assert.match(indexSource, /leaderboardPanel/);
  assert.match(indexSource, /toggleLeaderboardPanel/);
  assert.match(panelsSource, /leaderboardPanel/);
  assert.match(mainSource, /leaderboard\.js/);
  assert.match(mainSource, /firebaseLeaderboard\.js/);
});

test('score validation accepts finite scores inside the allowed range only', () => {
  const env = loadLeaderboardEnv();

  assert.strictEqual(env.context.NWLeaderboard.validateScore(42), 42);
  assert.strictEqual(env.context.NWLeaderboard.validateScore('42'), null);
  assert.strictEqual(env.context.NWLeaderboard.validateScore(-1), null);
  assert.strictEqual(env.context.NWLeaderboard.validateScore(100001), null);
  assert.strictEqual(env.context.NWLeaderboard.validateScore(Number.POSITIVE_INFINITY), null);
});

test('display names are trimmed, capped at 20 chars, and fallback when empty', () => {
  const env = loadLeaderboardEnv();

  assert.strictEqual(env.context.NWLeaderboard.sanitizeDisplayName('  Crashis  '), 'Crashis');
  assert.strictEqual(env.context.NWLeaderboard.sanitizeDisplayName(''), 'Anonymní hráč');
  assert.strictEqual(env.context.NWLeaderboard.sanitizeDisplayName('abcdefghijklmnopqrstXYZ'), 'abcdefghijklmnopqrst');
});

test('normal-game score submit skips boss mode and invalid scores', async () => {
  const env = loadLeaderboardEnv({ currentGameMode: 'bezosBoss' });
  const submitted = [];
  env.context.NWLeaderboard.setOnlineService({
    submitBestScore(score, displayName) {
      submitted.push({ score, displayName });
      return Promise.resolve();
    },
    fetchTopScores() {
      return Promise.resolve([]);
    }
  });

  await env.context.NWLeaderboard.submitNormalGameScore(50);
  vm.runInContext('currentGameMode = "normal"', env.context);
  await env.context.NWLeaderboard.submitNormalGameScore(100001);
  await env.context.NWLeaderboard.submitNormalGameScore(50);

  assert.deepStrictEqual(submitted, [{ score: 50, displayName: 'Anonymní hráč' }]);
});

test('leaderboard panel renders ranked rows from service results', async () => {
  const env = loadLeaderboardEnv();
  env.context.NWLeaderboard.setOnlineService({
    submitBestScore() {
      return Promise.resolve();
    },
    fetchTopScores() {
      return Promise.resolve([
        { displayName: 'Ada', bestScore: 99 },
        { displayName: 'Bob', bestScore: 88 }
      ]);
    }
  });

  await env.context.toggleLeaderboardPanel(true);

  assert.strictEqual(env.context.closedPanel, 'leaderboardPanel');
  assert.strictEqual(env.elements.leaderboardPanel.classList.contains('active'), true);
  assert.strictEqual(env.elements.leaderboardBody.children.length, 2);
  assert.strictEqual(env.elements.leaderboardBody.children[0].children[0].textContent, '#1');
  assert.strictEqual(env.elements.leaderboardBody.children[0].children[1].textContent, 'Ada');
  assert.strictEqual(env.elements.leaderboardBody.children[0].children[2].textContent, '99');
});

test('leaderboard panel shows sleeping fallback when service is unavailable', async () => {
  const env = loadLeaderboardEnv();

  await env.context.toggleLeaderboardPanel(true);

  assert.strictEqual(env.elements.leaderboardStatus.textContent, 'Leaderboard teď spí. Zkus to později.');
});

test('normal game-over flow calls leaderboard upload hook, boss flow stays isolated', () => {
  assert.match(gameLoopSource, /submitNormalGameScore\(score\)/);
  assert.doesNotMatch(fs.readFileSync(path.join(repoRoot, 'src/js/game/bossFight.js'), 'utf8'), /submitNormalGameScore/);
});
