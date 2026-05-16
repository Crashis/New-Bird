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
  renderMusicVolumeRow();
}

function renderMusicVolumeRow() {
  const slider = document.getElementById('musicVolumeSlider');
  const valueEl = document.getElementById('musicVolumeValue');
  const pct = Math.round((settings.musicVolume || 0) * 100);
  if (slider) {
    if (!slider.dataset.bound) {
      slider.dataset.bound = '1';
      slider.addEventListener('input', onMusicVolumeSliderInput);
      slider.addEventListener('change', onMusicVolumeSliderInput);
    }
    if (String(slider.value) !== String(pct)) slider.value = String(pct);
  }
  if (valueEl) valueEl.textContent = t('settings.musicVolume.value', { value: pct });
}

function onMusicVolumeSliderInput(e) {
  const raw = parseInt(e.target.value, 10);
  const pct = Number.isFinite(raw) ? Math.max(0, Math.min(100, raw)) : 35;
  if (typeof setMusicVolume === 'function') setMusicVolume(pct / 100);
  else settings.musicVolume = pct / 100;
  const valueEl = document.getElementById('musicVolumeValue');
  if (valueEl) valueEl.textContent = t('settings.musicVolume.value', { value: pct });
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
      // Pick the right track for whatever screen / phase we're currently in.
      updateMusicForState();
    } else {
      stopMusic();
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
