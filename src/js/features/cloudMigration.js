(function initCloudMigration(global) {
  const DISMISSED_KEY = 'cloudSaveMigrationDismissed';

  function wasMigrationDismissed() {
    try {
      return !!(global.localStorage && global.localStorage.getItem(DISMISSED_KEY) === '1');
    } catch (e) { return false; }
  }

  function markMigrationDismissed() {
    try {
      if (global.localStorage) global.localStorage.setItem(DISMISSED_KEY, '1');
    } catch (e) {}
  }

  function clearMigrationDismissed() {
    try {
      if (global.localStorage) global.localStorage.removeItem(DISMISSED_KEY);
    } catch (e) {}
  }

  function decideMigrationAction(input = {}) {
    const { firebaseAvailable, hasLocal, hasCloud, migrationDismissed } = input;
    if (!firebaseAvailable) return { action: 'noop', reason: 'firebase-unavailable' };
    if (hasCloud && hasLocal) return { action: 'prompt-conflict', reason: 'both' };
    if (hasCloud && !hasLocal) return { action: 'prompt-download', reason: 'cloud-only' };
    if (!hasCloud && hasLocal) {
      if (migrationDismissed) return { action: 'noop', reason: 'dismissed' };
      return { action: 'prompt-upload', reason: 'local-only' };
    }
    return { action: 'noop', reason: 'empty' };
  }

  function fmtSummary(summary) {
    if (!summary) return '';
    return `Rekord: <strong>${summary.bestScore}</strong> · Yangy: <strong>${summary.yang}</strong> · Peněženky: <strong>${summary.wallets}</strong> · Dračí mince: <strong>${summary.dragonCoins}</strong> · Skiny: <strong>${summary.skinCount}</strong> · Achievementy: <strong>${summary.achievementCount}</strong>`;
  }

  function buildButtons(action) {
    if (action === 'prompt-upload') {
      return [
        { label: 'Nahrát do cloudu', value: 'upload', primary: true },
        { label: 'Teď ne', value: 'dismiss', primary: false }
      ];
    }
    if (action === 'prompt-download') {
      return [
        { label: 'Načíst cloud', value: 'download', primary: true },
        { label: 'Teď ne', value: 'dismiss', primary: false }
      ];
    }
    if (action === 'prompt-conflict') {
      return [
        { label: 'Použít lokální a nahrát do cloudu', value: 'upload', primary: true },
        { label: 'Načíst cloud', value: 'download', primary: false },
        { label: 'Teď ne', value: 'dismiss', primary: false }
      ];
    }
    return [];
  }

  function buildMessage(action) {
    if (action === 'prompt-upload') {
      return 'Našli jsme tvůj lokální progress. Chceš ho uložit do cloudu, aby se neztratil a později šel načíst i jinde?';
    }
    if (action === 'prompt-download') {
      return 'Našli jsme cloud save. Chceš ho načíst?';
    }
    if (action === 'prompt-conflict') {
      return 'Našli jsme lokální i cloudový progress. Co chceš použít?';
    }
    return '';
  }

  function renderActions(container, buttons, onChoice) {
    container.innerHTML = '';
    buttons.forEach(({ label, value, primary }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = primary ? 'game-btn primary' : 'game-btn';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        if (typeof onChoice === 'function') onChoice(value);
      });
      container.appendChild(btn);
    });
  }

  function closeMigrationDialog() {
    const dialog = global.document && global.document.getElementById('cloudMigrationDialog');
    if (!dialog) return;
    dialog.classList.remove('active');
  }

  function openMigrationDialog(options) {
    const opts = options || {};
    const action = opts.action;
    if (!global.document) return false;
    const dialog = global.document.getElementById('cloudMigrationDialog');
    const msg = global.document.getElementById('cloudMigrationMessage');
    const sum = global.document.getElementById('cloudMigrationSummary');
    const actions = global.document.getElementById('cloudMigrationActions');
    if (!dialog || !msg || !sum || !actions) {
      console.warn('[cloudMigration] dialog DOM not present');
      return false;
    }
    const buttons = buildButtons(action);
    if (!buttons.length) return false;

    msg.textContent = buildMessage(action);

    let summaryHtml = '';
    if (opts.localSummary) summaryHtml += `<div><strong>Lokální:</strong> ${fmtSummary(opts.localSummary)}</div>`;
    if (opts.cloudSummary) summaryHtml += `<div><strong>Cloud:</strong> ${fmtSummary(opts.cloudSummary)}</div>`;
    sum.innerHTML = summaryHtml;

    renderActions(actions, buttons, (choice) => {
      closeMigrationDialog();
      if (typeof opts.onChoice === 'function') opts.onChoice(choice);
    });

    dialog.classList.add('active');
    return true;
  }

  global.NWCloudMigration = {
    DISMISSED_KEY,
    wasMigrationDismissed,
    markMigrationDismissed,
    clearMigrationDismissed,
    decideMigrationAction,
    openMigrationDialog,
    closeMigrationDialog,
    fmtSummary
  };
})(typeof window !== 'undefined' ? window : globalThis);
