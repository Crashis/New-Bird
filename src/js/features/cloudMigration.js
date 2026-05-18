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

  global.NWCloudMigration = {
    DISMISSED_KEY,
    wasMigrationDismissed,
    markMigrationDismissed,
    clearMigrationDismissed,
    decideMigrationAction
  };
})(typeof window !== 'undefined' ? window : globalThis);
