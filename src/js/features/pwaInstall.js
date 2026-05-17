// PWA install flow + service worker registration.
// Safe-by-default: any failure must not break the game.

(function () {
  let deferredInstallPrompt = null;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (_) {}
    if (window.navigator && window.navigator.standalone === true) return true;
    return false;
  }

  function getBtn() {
    return document.getElementById('menuInstallBtn');
  }

  function setHidden(hidden) {
    const btn = getBtn();
    if (!btn) return;
    btn.style.display = hidden ? 'none' : '';
  }

  function setLabel(text) {
    const btn = getBtn();
    if (!btn) return;
    btn.textContent = text;
  }

  function toast(title, subtitle) {
    if (typeof showUnlockToast === 'function') {
      try { showUnlockToast(title, subtitle, 'default'); return; } catch (_) {}
    }
    // Fallback if toast system isn't ready yet
    try { console.log('[install]', title, subtitle || ''); } catch (_) {}
  }

  function fallbackInstructions() {
    const ua = (navigator.userAgent || '').toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(ua);
    if (isMobile) {
      toast(
        'Přidej hru ručně',
        'Otevři menu prohlížeče a zvol „Přidat na plochu".'
      );
    } else {
      toast(
        'Přidej hru ručně',
        'Vpravo nahoře klikni na tři tečky → Uložit a sdílet → Vytvořit zástupce.'
      );
    }
  }

  async function onInstallClick() {
    if (isStandalone()) {
      toast('Už hraješ jako boss appka.', '');
      setHidden(true);
      return;
    }
    if (!deferredInstallPrompt) {
      fallbackInstructions();
      return;
    }
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        toast('Hotovo.', 'Hra se přidala na plochu. Teď už před ní neutečeš.');
      } else {
        toast('Instalace zrušena.', '');
      }
    } catch (e) {
      fallbackInstructions();
    } finally {
      deferredInstallPrompt = null;
      // After a prompt is used it cannot be reused; hide unless OS allows re-fire later.
      setHidden(true);
    }
  }

  function initButton() {
    const btn = getBtn();
    if (!btn) return;
    btn.addEventListener('click', onInstallClick);

    if (isStandalone()) {
      setLabel('✓ Hraješ jako appka');
      btn.disabled = true;
      btn.classList.add('installed');
      // Keep visible but disabled, or hide entirely:
      setHidden(true);
      return;
    }

    // Until beforeinstallprompt fires, keep the button hidden — it would just show a fallback.
    // On browsers that never fire the event the user can still trigger fallback via the bottom row hint.
    setHidden(true);
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (isStandalone()) return;
    setHidden(false);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setHidden(true);
    toast('Hotovo.', 'Hra se přidala na plochu. Teď už před ní neutečeš.');
  });

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    // Skip on non-http(s) origins (e.g. file://)
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        try { console.warn('[pwa] SW registration failed:', err); } catch (_) {}
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initButton);
  } else {
    initButton();
  }
  registerServiceWorker();
})();
