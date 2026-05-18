(function initProgressReset(global) {
  function resetLocalProgressToDefaults() {
    if (!global.NWProgressSnapshot || typeof global.NWProgressSnapshot.resetLocalProgressToDefaults !== 'function') return false;
    global.NWProgressSnapshot.resetLocalProgressToDefaults();
    return true;
  }

  function isCloudSaveActive() {
    try {
      if (!global.NWCloudSave || typeof global.NWCloudSave.getCloudSaveStatus !== 'function') return false;
      const { status } = global.NWCloudSave.getCloudSaveStatus();
      return status !== 'disabled' && status !== 'idle';
    } catch (e) { return false; }
  }

  async function resetAllProgress() {
    // If cloud save is active, reset cloud FIRST. Reason: if cloud reset failed but local
    // already wiped, the next sync from cloud would resurrect the old progress.
    if (isCloudSaveActive()) {
      try {
        const cloudOk = await global.NWCloudSave.resetCloudProgressToDefaults('manual-reset');
        if (!cloudOk) {
          console.warn('[progressReset] cloud reset failed; aborting local reset to avoid resurrected progress.');
          return { ok: false, stage: 'cloud' };
        }
      } catch (e) {
        console.warn('[progressReset] cloud reset threw; aborting local reset.', e);
        return { ok: false, stage: 'cloud', error: e };
      }
    }
    const localOk = resetLocalProgressToDefaults();
    if (!localOk) return { ok: false, stage: 'local' };
    return { ok: true };
  }

  global.NWProgressReset = {
    resetLocalProgressToDefaults,
    resetAllProgress
  };
})(typeof window !== 'undefined' ? window : globalThis);
