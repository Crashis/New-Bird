// Kolo štěstí — 1× denně, vstup 10 Yang, náhodná odměna z váženého rozdělení.

const WHEEL_ENTRY_COST = 10;
const WHEEL_DATE_KEY = 'wheelOfFortuneLastPlayedDate';
const WHEEL_SPIN_DURATION_MS = 3000;

// label: text na výseči/kostce, weight: pravděpodobnost (součet = 1.0)
const WHEEL_SLICES = [
  { id: 'nothing',    label: '·',  weight: 0.30 },
  { id: 'smallYang',  label: '💰', weight: 0.25 },
  { id: 'bigYang',    label: '💎', weight: 0.18 },
  { id: 'wallet',     label: '👛', weight: 0.10 },
  { id: 'dragonCoin', label: '🐲', weight: 0.07 },
  { id: 'errCube',    label: '🎲', weight: 0.07 },
  { id: 'jackpot',    label: '🏆', weight: 0.03 }
];

let wheelState = 'idle'; // 'idle' | 'spinning' | 'done'
let wheelSpinAnimId = null;
let wheelSpinUntil = 0;
let wheelDisplayIndex = 0;
let wheelBusy = false;

function wheelLocalDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function wheelPlayedToday() {
  try { return localStorage.getItem(WHEEL_DATE_KEY) === wheelLocalDate(); }
  catch (e) { return false; }
}

function saveWheelPlayed() {
  try { localStorage.setItem(WHEEL_DATE_KEY, wheelLocalDate()); } catch (e) {}
}

function setWheelStatus(msg, type) {
  const el = document.getElementById('wheelStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'wheel-status' + (type ? ' ' + type : '');
}

function pickWheelOutcome() {
  const r = Math.random();
  let acc = 0;
  for (const s of WHEEL_SLICES) {
    acc += s.weight;
    if (r < acc) return s;
  }
  return WHEEL_SLICES[0];
}

function applyWheelOutcome(slice) {
  switch (slice.id) {
    case 'nothing':
      return 'Nothing… better luck tomorrow.';
    case 'smallYang': {
      const r = 10 + Math.floor(Math.random() * 11); // 10–20
      yang += r; saveEconomy();
      return `+${r} Yang!`;
    }
    case 'bigYang': {
      const r = 30 + Math.floor(Math.random() * 31); // 30–60
      yang += r; saveEconomy();
      return `+${r} Yang!`;
    }
    case 'wallet':
      wallets += 1; saveEconomy();
      return '+1 Wallet!';
    case 'dragonCoin':
      dragonCoins += 1; saveDragonCoins();
      return '+1 Dragon Coin!';
    case 'errCube':
      errCubes += 1; saveErrCubes();
      return '+1 Err Cube!';
    case 'jackpot':
      yang += 100; wallets += 3; dragonCoins += 2;
      saveEconomy(); saveDragonCoins();
      return '🏆 JACKPOT! +100 Yang, +3 Wallets, +2 Dragon Coins!';
  }
  return '';
}

function renderWheelPanel() {
  const yangEl = document.getElementById('wheelYangs');
  if (yangEl) yangEl.textContent = yang;

  const face = document.getElementById('wheelFace');
  if (face) {
    if (wheelState === 'spinning') {
      face.textContent = WHEEL_SLICES[wheelDisplayIndex].label;
      face.classList.add('spinning');
    } else if (wheelState === 'done') {
      face.classList.remove('spinning');
    } else {
      face.textContent = '🎡';
      face.classList.remove('spinning');
    }
  }

  const spinBtn = document.getElementById('wheelSpinBtn');
  if (spinBtn) {
    const playedToday = wheelPlayedToday();
    spinBtn.disabled = wheelBusy || wheelState === 'spinning' || playedToday || yang < WHEEL_ENTRY_COST;
    spinBtn.classList.toggle('disabled', spinBtn.disabled);
    spinBtn.textContent = `Spin (${WHEEL_ENTRY_COST} Yang)`;
  }
}

function spinWheelAnimate() {
  if (wheelState !== 'spinning') return;
  wheelDisplayIndex = (wheelDisplayIndex + 1) % WHEEL_SLICES.length;
  const face = document.getElementById('wheelFace');
  if (face) face.textContent = WHEEL_SLICES[wheelDisplayIndex].label;

  if (performance.now() >= wheelSpinUntil) {
    finishWheelSpin();
    return;
  }
  wheelSpinAnimId = setTimeout(spinWheelAnimate, 90);
}

function startWheelSpin() {
  if (wheelBusy) return;
  if (wheelState === 'spinning') return;
  if (wheelPlayedToday()) {
    setWheelStatus('You already spun the Wheel of Fortune today. Come back after midnight.', 'error');
    return;
  }
  if (yang < WHEEL_ENTRY_COST) {
    setWheelStatus(`Not enough Yang. You need ${WHEEL_ENTRY_COST}.`, 'error');
    return;
  }
  wheelBusy = true;
  yang -= WHEEL_ENTRY_COST;
  saveEconomy();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();

  wheelState = 'spinning';
  wheelSpinUntil = performance.now() + WHEEL_SPIN_DURATION_MS;
  wheelDisplayIndex = 0;
  setWheelStatus('The wheel is spinning...', 'info');
  renderWheelPanel();
  if (wheelSpinAnimId) { clearTimeout(wheelSpinAnimId); wheelSpinAnimId = null; }
  wheelSpinAnimId = setTimeout(spinWheelAnimate, 90);
}

function finishWheelSpin() {
  if (wheelSpinAnimId) { clearTimeout(wheelSpinAnimId); wheelSpinAnimId = null; }
  const outcome = pickWheelOutcome();
  const face = document.getElementById('wheelFace');
  if (face) {
    face.textContent = outcome.label;
    face.classList.remove('spinning');
  }
  const msg = applyWheelOutcome(outcome);
  wheelState = 'done';
  saveWheelPlayed();
  if (typeof updateEconomyUi === 'function') updateEconomyUi();
  setWheelStatus(`You won: ${msg}`, outcome.id === 'nothing' ? 'info' : 'win');
  wheelBusy = false;
  renderWheelPanel();
}

function stopWheelAnimation() {
  if (wheelSpinAnimId) { clearTimeout(wheelSpinAnimId); wheelSpinAnimId = null; }
}

function initWheelOfFortune() {
  stopWheelAnimation();
  if (wheelState === 'spinning') wheelState = 'idle';
  wheelBusy = false;
  if (wheelPlayedToday()) {
    setWheelStatus('You already spun the Wheel of Fortune today. Come back after midnight.', 'error');
  } else {
    setWheelStatus(`Spin once per day for ${WHEEL_ENTRY_COST} Yang. Jackpot is rare but real.`, 'info');
  }
  renderWheelPanel();
}
