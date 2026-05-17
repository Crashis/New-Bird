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

  function getStoredPlayerName() {
    const keys = ['nw_flappy_player_name', 'nw_player_name', 'playerName', 'displayName'];
    for (const key of keys) {
      try {
        const value = global.localStorage && global.localStorage.getItem(key);
        if (value && value.trim()) return value;
      } catch (e) {}
    }
    return '';
  }

  function getCurrentDisplayName() {
    return sanitizeDisplayName(getStoredPlayerName());
  }

  function setOnlineService(service) {
    onlineService = service && typeof service === 'object' ? service : null;
  }

  function setLeaderboardStatus(text) {
    const status = global.document && global.document.getElementById('leaderboardStatus');
    if (!status) return;
    status.textContent = text || '';
  }

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
    for (let i = 0; i < safeEntries.length; i++) {
      const entry = safeEntries[i] || {};
      const row = global.document.createElement('div');
      row.className = 'leaderboard-row';

      const rank = global.document.createElement('span');
      rank.className = 'leaderboard-rank';
      rank.textContent = `#${i + 1}`;

      const name = global.document.createElement('span');
      name.className = 'leaderboard-name';
      name.textContent = sanitizeDisplayName(entry.displayName);

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
    setLeaderboardStatus(translate('leaderboard.loading', 'Načítám leaderboard...'));
    renderLeaderboardRows([]);
    if (!onlineService || typeof onlineService.fetchTopScores !== 'function') {
      setLeaderboardStatus(translate('leaderboard.sleeping', SLEEPING_MESSAGE));
      return;
    }
    try {
      const entries = await onlineService.fetchTopScores();
      renderLeaderboardRows(entries);
      setLeaderboardStatus(entries && entries.length ? '' : translate('leaderboard.empty', 'Zatím tu nikdo není.'));
    } catch (error) {
      console.warn('[leaderboard] read failed', error);
      renderLeaderboardRows([]);
      setLeaderboardStatus(translate('leaderboard.sleeping', SLEEPING_MESSAGE));
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
    if (open) await loadLeaderboardPanel();
  }

  const api = {
    validateScore,
    sanitizeDisplayName,
    getCurrentDisplayName,
    setOnlineService,
    renderLeaderboardRows,
    loadLeaderboardPanel,
    submitNormalGameScore
  };

  global.NWLeaderboard = api;
  global.toggleLeaderboardPanel = toggleLeaderboardPanel;
})(typeof globalThis !== 'undefined' ? globalThis : window);
