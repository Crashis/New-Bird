// Kovářova výzva — timing minihra s 3 strikami, sázka v Yangách.

const BLACKSMITH_MIN_BET = 10;
const BLACKSMITH_HIT_RADIUS = 5;        // ± 5 % od cíle = trefa
const BLACKSMITH_SPEED_BASE = 0.13;     // % za ms (1. strike)
const BLACKSMITH_SPEED_STEP = 0.06;     // přírůstek pro každý další strike

let blacksmithState = 'idle';           // 'idle' | 'aiming' | 'resolved'
let blacksmithBet = 0;
let blacksmithStrike = 0;               // 0..3 (počet odehraných striků)
let blacksmithHits = 0;
let blacksmithTargetCenter = 50;
let blacksmithMarkerPos = 0;
let blacksmithSpeed = BLACKSMITH_SPEED_BASE;
let blacksmithStartedAt = 0;
let blacksmithAnimId = null;
let blacksmithStrikeBusy = false;

function setBlacksmithStatus(msg, type) {
  const el = document.getElementById('blacksmithStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'blacksmith-status' + (type ? ' ' + type : '');
}

function renderBlacksmithPanel() {
  const yangEl = document.getElementById('blacksmithYangs');
  if (yangEl) yangEl.textContent = yang;

  const hitsEl = document.getElementById('blacksmithHitsLabel');
  if (hitsEl) hitsEl.textContent = `${blacksmithHits} / 3`;

  const strikesEl = document.getElementById('blacksmithStrikeLabel');
  if (strikesEl) strikesEl.textContent = `Strike ${Math.min(blacksmithStrike + 1, 3)} / 3`;

  const target = document.getElementById('blacksmithTarget');
  const zone = document.getElementById('blacksmithZone');
  const marker = document.getElementById('blacksmithMarker');
  if (target) target.style.left = `${blacksmithTargetCenter}%`;
  if (zone) {
    zone.style.left = `${Math.max(0, blacksmithTargetCenter - BLACKSMITH_HIT_RADIUS)}%`;
    zone.style.width = `${BLACKSMITH_HIT_RADIUS * 2}%`;
  }
  if (marker) marker.style.left = `${blacksmithMarkerPos}%`;

  const startBtn = document.getElementById('blacksmithStartBtn');
  const strikeBtn = document.getElementById('blacksmithStrikeBtn');
  const betInput = document.getElementById('blacksmithBetInput');

  if (startBtn) {
    startBtn.disabled = blacksmithState === 'aiming';
    startBtn.classList.toggle('disabled', startBtn.disabled);
  }
  if (strikeBtn) {
    strikeBtn.disabled = blacksmithState !== 'aiming' || blacksmithStrikeBusy;
    strikeBtn.classList.toggle('disabled', strikeBtn.disabled);
  }
  if (betInput) {
    betInput.disabled = blacksmithState === 'aiming';
  }
}

function stopBlacksmithAnimation() {
  if (blacksmithAnimId) {
    cancelAnimationFrame(blacksmithAnimId);
    blacksmithAnimId = null;
  }
}

function setBlacksmithNewTarget() {
  blacksmithTargetCenter = 20 + Math.random() * 60;
}

function updateBlacksmithMarker() {
  const elapsed = Math.max(0, performance.now() - blacksmithStartedAt);
  const raw = (elapsed * blacksmithSpeed) % 200;
  blacksmithMarkerPos = raw <= 100 ? raw : 200 - raw;
}

function animateBlacksmith() {
  if (blacksmithState !== 'aiming') return;
  updateBlacksmithMarker();
  renderBlacksmithPanel();
  blacksmithAnimId = requestAnimationFrame(animateBlacksmith);
}

function startBlacksmithAttempt() {
  if (blacksmithState === 'aiming') return;
  const betInput = document.getElementById('blacksmithBetInput');
  const bet = parseInt(betInput && betInput.value, 10);

  if (!Number.isFinite(bet) || bet < BLACKSMITH_MIN_BET) {
    setBlacksmithStatus(`Minimum bet is ${BLACKSMITH_MIN_BET} Yang.`, 'error');
    return;
  }
  if (yang < bet) {
    setBlacksmithStatus('Not enough Yang for that bet.', 'error');
    return;
  }

  yang -= bet;
  saveEconomy();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();

  blacksmithBet = bet;
  blacksmithStrike = 0;
  blacksmithHits = 0;
  blacksmithSpeed = BLACKSMITH_SPEED_BASE;
  setBlacksmithNewTarget();
  blacksmithMarkerPos = 0;
  blacksmithStartedAt = performance.now();
  blacksmithState = 'aiming';
  blacksmithStrikeBusy = false;
  setBlacksmithStatus('Strike when the marker is on the target!', 'info');
  renderBlacksmithPanel();
  stopBlacksmithAnimation();
  blacksmithAnimId = requestAnimationFrame(animateBlacksmith);
}

function blacksmithStrikeNow() {
  if (blacksmithState !== 'aiming' || blacksmithStrikeBusy) return;
  blacksmithStrikeBusy = true;

  const distance = Math.abs(blacksmithMarkerPos - blacksmithTargetCenter);
  const hit = distance <= BLACKSMITH_HIT_RADIUS;
  if (hit) blacksmithHits += 1;
  blacksmithStrike += 1;

  const range = document.getElementById('blacksmithRange');
  if (range) {
    range.classList.remove('hit');
    range.classList.remove('miss');
    void range.offsetWidth;
    range.classList.add(hit ? 'hit' : 'miss');
  }

  if (blacksmithStrike >= 3) {
    stopBlacksmithAnimation();
    blacksmithState = 'resolved';
    resolveBlacksmith();
    blacksmithStrikeBusy = false;
    renderBlacksmithPanel();
    return;
  }

  // Další kolo — zrychli a nový cíl.
  blacksmithSpeed += BLACKSMITH_SPEED_STEP;
  setBlacksmithNewTarget();
  blacksmithStartedAt = performance.now();
  setBlacksmithStatus(hit ? `Hit! ${blacksmithHits}/3` : `Miss! ${blacksmithHits}/3`, hit ? 'win' : 'lose');
  blacksmithStrikeBusy = false;
  renderBlacksmithPanel();
}

function resolveBlacksmith() {
  let payout = blacksmithHits * blacksmithBet;
  let bonusDc = false;
  if (blacksmithHits >= 3 && Math.random() < 0.10) bonusDc = true;

  if (payout > 0) yang += payout;
  saveEconomy();
  if (bonusDc) { dragonCoins += 1; saveDragonCoins(); }
  if (typeof updateEconomyUi === 'function') updateEconomyUi();

  let msg = '';
  if (blacksmithHits === 0) {
    msg = `No hits. You lost ${blacksmithBet} Yang.`;
    setBlacksmithStatus(msg, 'lose');
  } else if (blacksmithHits === 1) {
    msg = `1 hit — your bet was returned (+${payout} Yang).`;
    setBlacksmithStatus(msg, 'info');
  } else if (blacksmithHits === 2) {
    msg = `2 hits — you won ${payout} Yang!`;
    setBlacksmithStatus(msg, 'win');
  } else {
    msg = `3 hits! You won ${payout} Yang${bonusDc ? ' + 1 Dragon Coin!' : '!'}`;
    setBlacksmithStatus(msg, 'win');
  }
}

function initBlacksmith() {
  stopBlacksmithAnimation();
  blacksmithState = 'idle';
  blacksmithStrike = 0;
  blacksmithHits = 0;
  blacksmithSpeed = BLACKSMITH_SPEED_BASE;
  blacksmithMarkerPos = 0;
  blacksmithStrikeBusy = false;
  setBlacksmithNewTarget();
  setBlacksmithStatus('Place a bet and hit the moving target 3 times. Each strike gets faster.', 'info');
  renderBlacksmithPanel();
}
