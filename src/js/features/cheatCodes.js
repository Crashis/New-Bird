window.NWCheatCodes = window.NWCheatCodes || {};

function showCheatStatus(message, isError) {
  const el = document.getElementById('cheatCodeStatus');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', !!isError);
}

function unlockAdminSkinFromCheat() {
  const adminSkin = SKINS.find(s => s.id === ADMIN_SKIN_ID);
  if (!adminSkin) {
    showCheatStatus(t('cheats.unknown'), true);
    return;
  }
  if (adminSkin.unlocked) {
    showCheatStatus(t('cheats.adminAlready'));
    return;
  }
  adminSkin.unlocked = true;
  saveUnlockedSkins();
  if (typeof renderSkinsPanel === 'function') renderSkinsPanel();
  showCheatStatus(t('cheats.adminUnlocked'));
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('cheats.adminToastTitle'), t('cheats.adminToastSub'), 'skin');
  }
}

function applyCheatCode(rawCode) {
  const code = (rawCode || '').trim().toLowerCase();
  if (!code) {
    showCheatStatus(t('cheats.unknown'), true);
    return;
  }
  if (code === 'admin') {
    unlockAdminSkinFromCheat();
    return;
  }
  if (code === 'hesoyam') {
    applyHesoyamCheat();
    return;
  }
  showCheatStatus(t('cheats.unknown'), true);
}

function applyHesoyamCheat() {
  addYangs(500);
  wallets += 50;
  saveEconomy();
  if (typeof addDragonCoins === 'function') addDragonCoins(5);
  updateEconomyUi();
  showCheatStatus(t('cheat.hesoyam.status'));
  if (typeof showUnlockToast === 'function') {
    showUnlockToast(t('toast.hesoyam.title'), t('toast.hesoyam.subtitle'), 'upgrade');
  }
}

function applyCheatCodeFromInput() {
  const input = document.getElementById('cheatCodeInput');
  if (!input) return;
  applyCheatCode(input.value);
  input.value = '';
  input.focus();
}

window.NWCheatCodes.initCheatCodes = function initCheatCodes() {
  const input = document.getElementById('cheatCodeInput');
  if (input && !input.dataset.cheatBound) {
    input.dataset.cheatBound = '1';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCheatCodeFromInput();
      }
    });
  }
};
