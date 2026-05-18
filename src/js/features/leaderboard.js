(function initLeaderboardFeature(global) {
  const MAX_LEADERBOARD_SCORE = 100000;
  const MAX_DISPLAY_NAME_LENGTH = 20;
  const FALLBACK_DISPLAY_NAME = 'Anonymní hráč';
  const SLEEPING_MESSAGE = 'Leaderboard teď spí. Zkus to později.';

  let onlineService = null;

  function translate(key, fallback) {
    if (typeof global.t === 'function') return global.t(key);
    return fallback;
  }

  function validateScore(scoreValue) {
    if (typeof scoreValue !== 'number') return null;
    if (!Number.isFinite(scoreValue)) return null;
    if (scoreValue < 0 || scoreValue > MAX_LEADERBOARD_SCORE) return null;
    return Math.floor(scoreValue);
  }

  function sanitizeDisplayName(displayName) {
    const trimmed = typeof displayName === 'string' ? displayName.trim() : '';
    const safeName = trimmed || FALLBACK_DISPLAY_NAME;
    return safeName.slice(0, MAX_DISPLAY_NAME_LENGTH);
  }

  const PLAYER_NAME_STORAGE_KEY = 'nw_player_name';
  const LEGACY_NAME_KEYS = ['nw_flappy_player_name', 'playerName', 'displayName'];
  const MAX_RAW_NAME_INPUT = 200;

  function readLocalStorage(key) {
    try {
      return (global.localStorage && global.localStorage.getItem(key)) || '';
    } catch (e) {
      return '';
    }
  }

  function writeLocalStorage(key, value) {
    try {
      if (global.localStorage) global.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getStoredPlayerName() {
    const primary = readLocalStorage(PLAYER_NAME_STORAGE_KEY);
    if (primary && primary.trim()) return primary;
    for (const key of LEGACY_NAME_KEYS) {
      const value = readLocalStorage(key);
      if (value && value.trim()) return value;
    }
    return '';
  }

  function getCurrentDisplayName() {
    return sanitizeDisplayName(getStoredPlayerName());
  }

  function setNicknameStatus(text, tone) {
    const status = global.document && global.document.getElementById('leaderboardNicknameStatus');
    if (!status) return;
    status.textContent = text || '';
    status.style.color = tone === 'error' ? '#e57373' : tone === 'ok' ? '#7bd389' : '';
  }

  async function setPlayerName(rawValue) {
    const truncatedRaw = typeof rawValue === 'string' ? rawValue.slice(0, MAX_RAW_NAME_INPUT) : '';
    const trimmed = truncatedRaw.trim();
    const safeName = sanitizeDisplayName(trimmed);
    const valueToStore = trimmed ? safeName : '';
    writeLocalStorage(PLAYER_NAME_STORAGE_KEY, valueToStore);

    const okMessage = trimmed
      ? translate('leaderboard.nickname.saved', 'Jméno uložené.')
      : translate('leaderboard.nickname.cleared', 'Jméno smazané, používá se „Anonymní hráč“.');

    if (onlineService && typeof onlineService.updateDisplayName === 'function') {
      try {
        const updated = await onlineService.updateDisplayName(safeName);
        setNicknameStatus(okMessage + (updated ? '' : translate('leaderboard.nickname.localOnly', ' (zatím jen lokálně)')), 'ok');
      } catch (error) {
        console.warn('[leaderboard] nickname update failed', error);
        setNicknameStatus(translate('leaderboard.nickname.warnSync', 'Uloženo lokálně, online sync selhal.'), 'error');
      }
    } else {
      setNicknameStatus(okMessage + translate('leaderboard.nickname.localOnly', ' (zatím jen lokálně)'), 'ok');
    }
    try { if (global.NWCloudSave && typeof global.NWCloudSave.flushCloudSave === 'function') global.NWCloudSave.flushCloudSave('nickname-change'); } catch (e) {}
    return safeName;
  }

  function syncNicknameInputUi() {
    const input = global.document && global.document.getElementById('leaderboardNicknameInput');
    if (!input) return;
    const stored = readLocalStorage(PLAYER_NAME_STORAGE_KEY);
    input.value = stored ? sanitizeDisplayName(stored) : '';
    setNicknameStatus('', null);
  }

  let nicknameUiWired = false;
  function wireNicknameUi() {
    if (nicknameUiWired) return;
    const doc = global.document;
    if (!doc) return;
    const input = doc.getElementById('leaderboardNicknameInput');
    const button = doc.getElementById('leaderboardNicknameSave');
    if (!input || !button) return;
    button.addEventListener('click', () => { setPlayerName(input.value); });
    input.addEventListener('keydown', event => {
      if (event && event.key === 'Enter') {
        event.preventDefault();
        setPlayerName(input.value);
      }
    });
    nicknameUiWired = true;
  }

  function setOnlineService(service) {
    onlineService = service && typeof service === 'object' ? service : null;
  }

  function setLeaderboardStatus(text, tone) {
    const status = global.document && global.document.getElementById('leaderboardStatus');
    if (!status) return;
    status.textContent = text || '';
    status.classList.remove('loading', 'error', 'empty');
    if (tone) status.classList.add(tone);
  }

  const RANK_MEDALS = ['🥇', '🥈', '🥉'];

  function clearLeaderboardBody() {
    const body = global.document && global.document.getElementById('leaderboardBody');
    if (!body) return null;
    body.innerHTML = '';
    if (body.children && typeof body.children.length === 'number' && Array.isArray(body.children)) {
      body.children.length = 0;
    }
    return body;
  }

  function renderLeaderboardRows(entries) {
    const body = clearLeaderboardBody();
    if (!body) return;
    const safeEntries = Array.isArray(entries) ? entries.slice(0, 10) : [];
    const currentName = getCurrentDisplayName();
    for (let i = 0; i < safeEntries.length; i++) {
      const entry = safeEntries[i] || {};
      const row = global.document.createElement('div');
      const rankIndex = i + 1;
      const entryName = sanitizeDisplayName(entry.displayName);
      const classes = ['leaderboard-row', `rank-${rankIndex}`];
      if (currentName && entryName === currentName) classes.push('is-current-player');
      row.className = classes.join(' ');

      const rank = global.document.createElement('span');
      rank.className = 'leaderboard-rank';
      rank.textContent = i < RANK_MEDALS.length ? RANK_MEDALS[i] : `#${rankIndex}`;

      const name = global.document.createElement('span');
      name.className = 'leaderboard-name';
      name.textContent = entryName;

      const scoreEl = global.document.createElement('span');
      scoreEl.className = 'leaderboard-score';
      scoreEl.textContent = String(validateScore(entry.bestScore) ?? 0);

      row.appendChild(rank);
      row.appendChild(name);
      row.appendChild(scoreEl);
      body.appendChild(row);
    }
  }

  async function loadLeaderboardPanel() {
    setLeaderboardStatus(translate('leaderboard.loading', 'Načítám hrdiny z databáze...'), 'loading');
    renderLeaderboardRows([]);
    if (!onlineService || typeof onlineService.fetchTopScores !== 'function') {
      setLeaderboardStatus(translate('leaderboard.sleeping', SLEEPING_MESSAGE), 'error');
      return;
    }
    try {
      const entries = await onlineService.fetchTopScores();
      renderLeaderboardRows(entries);
      if (entries && entries.length) {
        setLeaderboardStatus('');
      } else {
        setLeaderboardStatus(translate('leaderboard.empty', 'Zatím tu nikdo není. Buď první legenda.'), 'empty');
      }
    } catch (error) {
      console.warn('[leaderboard] read failed', error);
      renderLeaderboardRows([]);
      setLeaderboardStatus(translate('leaderboard.sleeping', SLEEPING_MESSAGE), 'error');
    }
  }

  async function submitNormalGameScore(scoreValue) {
    if (global.currentGameMode && global.currentGameMode !== 'normal') return;
    const validScore = validateScore(scoreValue);
    if (validScore === null) return;
    if (!onlineService || typeof onlineService.submitBestScore !== 'function') return;
    try {
      await onlineService.submitBestScore(validScore, getCurrentDisplayName());
    } catch (error) {
      console.warn('[leaderboard] score write failed', error);
    }
  }

  async function toggleLeaderboardPanel(forceOpen) {
    const panel = global.document && global.document.getElementById('leaderboardPanel');
    if (!panel) return;
    const open = typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('active');
    if (open && global.gameState === 'playing') {
      global.activeVoiceLine = translate('panel.settingsBlocked', 'Panel otevřeš až mimo aktivní let.');
      global.activeVoiceLineUntil = global.performance && typeof global.performance.now === 'function'
        ? global.performance.now() + 2800
        : 0;
      return;
    }
    if (typeof global.closeOtherPanels === 'function') global.closeOtherPanels('leaderboardPanel');
    panel.classList.toggle('active', open);
    if (open) {
      wireNicknameUi();
      syncNicknameInputUi();
      await loadLeaderboardPanel();
    }
  }

  const api = {
    validateScore,
    sanitizeDisplayName,
    getCurrentDisplayName,
    setPlayerName,
    setOnlineService,
    renderLeaderboardRows,
    loadLeaderboardPanel,
    submitNormalGameScore
  };

  global.NWLeaderboard = api;
  global.toggleLeaderboardPanel = toggleLeaderboardPanel;
})(typeof globalThis !== 'undefined' ? globalThis : window);
