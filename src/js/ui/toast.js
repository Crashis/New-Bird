function showUnlockToast(title, subtitle, type = 'default') {
  const toast = document.getElementById('unlockToast');
  if (!toast) return;
  const titleEl = toast.querySelector('.unlock-toast-title');
  const subtitleEl = toast.querySelector('.unlock-toast-subtitle');
  if (titleEl) titleEl.textContent = title || '';
  if (subtitleEl) subtitleEl.textContent = subtitle || '';

  const types = ['default', 'upgrade', 'skin', 'wallet', 'achievement'];
  toast.classList.remove('hidden', 'show', 'default', 'upgrade', 'skin', 'wallet', 'achievement', 'no-effects');
  toast.classList.add(types.includes(type) ? type : 'default');
  if (!settings.effects) toast.classList.add('no-effects');
  if (unlockToastTimer) {
    clearTimeout(unlockToastTimer);
    unlockToastTimer = null;
  }
  void toast.offsetWidth;
  toast.classList.add('show');
  unlockToastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
    unlockToastTimer = null;
  }, settings.effects ? 2600 : 2400);
}
