function renderSettingsPanel() {
  const map = {
    sfx: 'settingsSfxToggle',
    music: 'settingsMusicToggle',
    voiceLines: 'settingsVoiceToggle',
    effects: 'settingsEffectsToggle',
    mobileBoost: 'settingsMobileBoostToggle'
  };
  for (const key of Object.keys(map)) {
    const el = document.getElementById(map[key]);
    if (el) el.classList.toggle('on', !!settings[key]);
  }
}

function toggleSetting(key) {
  if (!(key in settings)) return;
  settings[key] = !settings[key];
  saveSetting(key);
  renderSettingsPanel();
  applySettingSideEffects(key);
}

function applySettingSideEffects(key) {
  if (key === 'music') {
    if (settings.music) {
      if (gameState === 'playing') startGameMusic();
    } else {
      stopGameMusic();
    }
  } else if (key === 'sfx') {
    // No persistent SFX to stop; new ones simply won't play.
  } else if (key === 'voiceLines') {
    if (!settings.voiceLines) {
      activeVoiceLine = null;
      activeVoiceLineUntil = 0;
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  } else if (key === 'effects') {
    if (!settings.effects) particles.length = 0;
  } else if (key === 'mobileBoost') {
    window.MOBILE_BOOST = settings.mobileBoost === true;
    if (typeof window.NWUtils?.refreshPerfMobile === 'function') {
      window.NWUtils.refreshPerfMobile();
    }
    document.body.classList.toggle('mobile-boost', window.MOBILE_BOOST);
    if (window.MOBILE_BOOST) particles.length = 0;
  }
}
