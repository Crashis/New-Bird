// Multiplayer panel UI – Fáze 1.
//
// Tenhle soubor je classic script (žádné moduly), aby seděl ke zbytku projektu.
// Logika Firebase je v ESM modulu src/js/firebase/multiplayerService.js, který
// se line-importne až při prvním otevření panelu. Singleplayer hra se kvůli
// této vrstvě nikdy nezmění.

(function () {
  let serviceLoadPromise = null;
  let service = null;            // window.NWMultiplayer po načtení
  let unsubscribeChange = null;
  let lastLobby = null;
  let lastResultShown = false;
  let progressTicker = null;

  function $(id) { return document.getElementById(id); }

  function setStatus(text) {
    const el = $('multiplayerStatusText');
    if (el) el.textContent = text || '';
  }

  function setError(text) {
    const el = $('multiplayerErrorText');
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.style.display = '';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  function isFirebaseConfigured() {
    return !!(window.NWMultiplayer || (typeof db !== 'undefined' && db));
  }

  async function ensureService() {
    if (service) return service;
    if (!serviceLoadPromise) {
      serviceLoadPromise = import('../firebase/multiplayerService.js')
        .then(() => window.NWMultiplayer)
        .catch((e) => {
          console.warn('[multiplayer] modul se nepodařilo načíst', e);
          return null;
        });
    }
    service = await serviceLoadPromise;
    return service;
  }

  function getUid() {
    try {
      const lb = window.NWLeaderboard;
      if (lb && lb.onlineService && typeof lb.onlineService.getUid === 'function') {
        const id = lb.onlineService.getUid();
        if (id) return id;
      }
    } catch (e) {}
    try {
      // Firebase modul globální? Zkus přes auth.currentUser, pokud existuje.
      if (typeof auth !== 'undefined' && auth && auth.currentUser) return auth.currentUser.uid;
    } catch (e) {}
    return null;
  }

  function getDefaultName() {
    try {
      const saved = localStorage.getItem('nw_mp_name');
      if (saved) return saved;
    } catch (e) {}
    if (typeof window.NWLeaderboard?.getDisplayName === 'function') {
      const n = window.NWLeaderboard.getDisplayName();
      if (n) return n;
    }
    return 'Hráč';
  }

  function saveName(name) {
    try { localStorage.setItem('nw_mp_name', name || ''); } catch (e) {}
  }

  function renderPanel(lobby) {
    const home = $('multiplayerHomeSection');
    const lobbySec = $('multiplayerLobbySection');
    const resultSec = $('multiplayerResultSection');
    if (!home || !lobbySec || !resultSec) return;

    if (!lobby) {
      home.style.display = '';
      lobbySec.style.display = 'none';
      resultSec.style.display = 'none';
      setStatus(isFirebaseConfigured() ? 'Připraven k vytvoření nebo připojení do lobby.' : 'Firebase není nakonfigurováno – multiplayer nedostupný.');
      return;
    }

    const status = lobby.status;
    const inResult = status === 'finished' && !service.getState().role ? false : (status === 'finished');

    if (inResult) {
      home.style.display = 'none';
      lobbySec.style.display = 'none';
      resultSec.style.display = '';
      renderResult(lobby);
    } else {
      home.style.display = 'none';
      lobbySec.style.display = '';
      resultSec.style.display = 'none';
      renderLobby(lobby);
    }
  }

  function renderLobby(lobby) {
    const codeEl = $('multiplayerLobbyCode');
    if (codeEl) codeEl.textContent = lobby.code || '------';

    const listEl = $('multiplayerPlayersList');
    if (listEl) {
      listEl.innerHTML = '';
      const slots = [
        { slot: 'host', label: 'Host' },
        { slot: 'guest', label: 'Guest' }
      ];
      for (const { slot, label } of slots) {
        const p = lobby.players?.[slot];
        const ann = lobby._annotations?.players?.[slot];
        const li = document.createElement('li');
        li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.6rem; margin:0.25rem 0; background:rgba(255,255,255,0.04); border-radius:6px;';
        if (!p) {
          li.innerHTML = `<span><strong>${label}:</strong> <em style="opacity:0.6;">Čekání…</em></span>`;
        } else {
          const me = service.getState().uid === p.id ? ' (ty)' : '';
          const readyChip = p.ready ? '<span style="color:#7fe48a;">✔ Ready</span>' : '<span style="opacity:0.6;">Nepřipraven</span>';
          const stale = ann?.staleConnection ? ' <span style="color:#ff9a9a;">⚠ Odpojen</span>' : '';
          li.innerHTML = `<span><strong>${label}:</strong> ${escapeHtml(p.name || '?')}${me}</span><span>${readyChip}${stale}</span>`;
        }
        listEl.appendChild(li);
      }
    }

    const myRole = service.getState().role;
    const me = lobby.players?.[myRole];
    const guest = lobby.players?.guest;
    const host = lobby.players?.host;

    const readyBtn = $('multiplayerReadyBtn');
    const startBtn = $('multiplayerStartBtn');

    if (myRole === 'guest' && readyBtn) {
      readyBtn.style.display = '';
      readyBtn.textContent = me?.ready ? '↺ Zrušit Ready' : '✔ Ready';
    } else if (readyBtn) {
      readyBtn.style.display = 'none';
    }

    if (myRole === 'host' && startBtn) {
      startBtn.style.display = '';
      const canStart = !!(host && guest && host.ready && guest.ready && lobby.status === 'waiting');
      startBtn.disabled = !canStart;
    } else if (startBtn) {
      startBtn.style.display = 'none';
    }

    setStatus(
      lobby.status === 'waiting'
        ? (guest ? 'Oba hráči v lobby. Čekáme na Ready a Start.' : 'Pošli kód kamarádovi a počkej, až se připojí.')
        : (lobby.status === 'playing' ? 'Hra běží…' : `Stav: ${lobby.status}`)
    );
  }

  function renderResult(lobby) {
    const titleEl = $('multiplayerResultTitle');
    const bodyEl = $('multiplayerResultBody');
    const myUid = service.getState().uid;
    const host = lobby.players?.host;
    const guest = lobby.players?.guest;
    const winnerId = lobby.winnerId || null;
    let title = '🤝 Remíza';
    if (winnerId === myUid) title = '🏆 Vyhrál jsi!';
    else if (winnerId) title = '💀 Prohrál jsi…';
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-top:0.4rem;">
          ${playerResultCard('Host', host, winnerId)}
          ${playerResultCard('Guest', guest, winnerId)}
        </div>
        <p class="hint" style="margin-top:0.5rem;">Klikni Rematch — odstartuje, jakmile potvrdí oba.</p>
      `;
    }
    // Rematch tlačítko: pokud já už jsem požádal, deaktivuj.
    const myRole = service.getState().role;
    const meRow = lobby.players?.[myRole];
    const rematchBtn = $('multiplayerRematchBtn');
    if (rematchBtn) {
      const wants = !!meRow?.wantsRematch;
      rematchBtn.disabled = wants;
      rematchBtn.textContent = wants ? '⏳ Čekání na druhého hráče…' : '🔁 Rematch';
    }
  }

  function playerResultCard(label, p, winnerId) {
    if (!p) return `<div style="padding:0.5rem; background:rgba(255,255,255,0.04); border-radius:6px;"><strong>${label}</strong><br><em style="opacity:0.6;">—</em></div>`;
    const isWinner = winnerId && winnerId === p.id;
    const border = isWinner ? '2px solid #f0d080' : '1px solid rgba(255,255,255,0.06)';
    return `<div style="padding:0.5rem; background:rgba(255,255,255,0.04); border-radius:6px; border:${border};">
      <strong>${label}: ${escapeHtml(p.name || '?')}</strong><br>
      <small>Distance: ${p.distance || 0}</small><br>
      <small>Score: ${p.score || 0}</small>
    </div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function handleChange(eventType, payload) {
    if (eventType === 'change' || eventType === 'left' || eventType === 'lobby-removed') {
      lastLobby = (eventType === 'change') ? payload : null;
      renderPanel(lastLobby);
    }
    if (eventType === 'game-started' && payload && payload.status === 'playing') {
      maybeAutoStartLocalGame(payload);
    }
    if (eventType === 'game-finished') {
      lastResultShown = true;
      stopProgressTicker();
      window.__nwMultiplayerLocalStarted = false;
      // Auto-otevři panel s výsledkem (skryje gameOver panel).
      try {
        const gameOver = document.getElementById('gameOverPanel');
        if (gameOver) gameOver.classList.remove('active');
        if (typeof toggleMultiplayerPanel === 'function') toggleMultiplayerPanel(true);
      } catch (e) {}
    }
    if (eventType === 'lobby-removed') {
      setError('Lobby byla zavřena.');
    }
  }

  function maybeAutoStartLocalGame(lobby) {
    // Spustí lokálně singleplayer hru u obou hráčů, jakmile status → playing.
    if (window.__nwMultiplayerLocalStarted) return;
    if (typeof gameState !== 'undefined' && gameState === 'playing') return;
    if (typeof startGame !== 'function') return;
    window.__nwMultiplayerLocalStarted = true;
    // Zavři panel a spusť hru.
    if (typeof toggleMultiplayerPanel === 'function') toggleMultiplayerPanel(false);
    setTimeout(() => {
      try { startGame(); } catch (e) { console.warn('[mp] startGame error', e); }
      startProgressTicker();
    }, 50);
  }

  function startProgressTicker() {
    stopProgressTicker();
    progressTicker = setInterval(() => {
      if (!service) return;
      const st = service.getState();
      if (!st.lobbyCode || !st.role) { stopProgressTicker(); return; }
      try {
        // `score`, `frameCount`, `gameState` jsou let-globály z classic skriptů
        // (state.js / gameLoop.js). Z classic skriptu jsou přímo dostupné.
        const curScore = (typeof score === 'number') ? score : 0;
        const curFrame = (typeof frameCount === 'number') ? frameCount : 0;
        const isAlive = (typeof gameState === 'string') ? (gameState === 'playing') : true;
        service.setLocalProgress({ distance: curFrame, score: curScore, alive: isAlive });
        if (!isAlive) {
          service.markPlayerDied();
          stopProgressTicker();
          window.__nwMultiplayerLocalStarted = false;
        }
      } catch (e) {
        // tichý fail
      }
    }, 500);
  }

  function stopProgressTicker() {
    if (progressTicker) clearInterval(progressTicker);
    progressTicker = null;
  }

  // ──────────────────────────────────────────────────────────────
  // Public (přes globální okno) – volá panels.js
  // ──────────────────────────────────────────────────────────────

  window.initMultiplayerPanel = async function initMultiplayerPanel() {
    setError('');
    bindOnce();
    // Předvyplň jméno.
    const nameInput = $('multiplayerNameInput');
    if (nameInput && !nameInput.value) nameInput.value = getDefaultName();

    const svc = await ensureService();
    if (!svc) {
      renderPanel(null);
      setStatus('Firebase modul se nepodařilo načíst – multiplayer nedostupný.');
      return;
    }
    const uid = getUid();
    if (!uid) {
      renderPanel(null);
      setStatus('Pro multiplayer potřebuješ být přihlášený (anonymně to stačí).');
      return;
    }
    svc.initMultiplayer(uid);
    if (!unsubscribeChange) {
      unsubscribeChange = svc.onChange(handleChange);
    }
    renderPanel(svc.getState().lobby || lastLobby);
  };

  window.onMultiplayerPanelClosed = function onMultiplayerPanelClosed() {
    // Listener necháváme aktivní, aby se v lobby dál tipovaly změny i při zavřeném panelu
    // (např. když host startuje hru a oba mají panel zavřený). Aktivně neodpojujeme.
  };

  function bindOnce() {
    const root = $('multiplayerPanel');
    if (!root || root.dataset.mpBound === '1') return;
    root.dataset.mpBound = '1';

    $('multiplayerCreateBtn')?.addEventListener('click', async () => {
      setError('');
      try {
        const name = ($('multiplayerNameInput')?.value || '').trim() || 'Host';
        saveName(name);
        await service.createLobby({ name });
      } catch (e) {
        setError(e.message || 'Chyba při vytváření lobby.');
      }
    });

    $('multiplayerJoinBtn')?.addEventListener('click', async () => {
      setError('');
      try {
        const name = ($('multiplayerNameInput')?.value || '').trim() || 'Guest';
        const code = ($('multiplayerCodeInput')?.value || '').trim().toUpperCase();
        saveName(name);
        await service.joinLobby({ code, name });
      } catch (e) {
        setError(e.message || 'Připojení selhalo.');
      }
    });

    $('multiplayerCodeInput')?.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    });

    $('multiplayerCopyCodeBtn')?.addEventListener('click', () => {
      const code = service?.getState()?.lobbyCode;
      if (!code) return;
      try { navigator.clipboard?.writeText(code); } catch (e) {}
    });

    $('multiplayerReadyBtn')?.addEventListener('click', async () => {
      setError('');
      const st = service.getState();
      const me = st.lobby?.players?.[st.role];
      try {
        await service.setReady(!me?.ready);
      } catch (e) {
        setError(e.message || 'Chyba.');
      }
    });

    $('multiplayerStartBtn')?.addEventListener('click', async () => {
      setError('');
      try {
        await service.startGame();
      } catch (e) {
        setError(e.message || 'Start se nepodařil.');
      }
    });

    $('multiplayerLeaveBtn')?.addEventListener('click', async () => {
      setError('');
      try { await service.leaveLobby(); } catch (e) { setError(e.message); }
    });

    $('multiplayerLeaveResultBtn')?.addEventListener('click', async () => {
      setError('');
      try { await service.leaveLobby(); } catch (e) { setError(e.message); }
    });

    $('multiplayerBackToLobbyBtn')?.addEventListener('click', () => {
      // Zatím skok zpět jen vizuálně – Firestore stav řídí host. Pro guest UX:
      // pokud lobby je 'finished', UI ukazuje výsledek; po rematchi se vrátí samo.
      setError('Lobby se obnoví automaticky, jakmile oba kliknou Rematch.');
    });

    $('multiplayerRematchBtn')?.addEventListener('click', async () => {
      setError('');
      try { await service.requestRematch(); } catch (e) { setError(e.message); }
    });
  }
})();
